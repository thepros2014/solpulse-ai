const {
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');
const crypto = require('crypto');

// SPL Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Default ZK Payroll Program ID
const DEFAULT_PROGRAM_ID = new PublicKey('ZKPay111111111111111111111111111111111111111');

/**
 * Helper to compute SHA-256 hash as Uint8Array (32 bytes)
 */
function sha256(data) {
    return crypto.createHash('sha256').update(data).digest();
}

/**
 * Hash employee payroll record into a 32-byte Merkle leaf.
 */
function hashPayrollLeaf(employeePubkey, amountLamports, batchId, leafIndex) {
    const pubkeyBuffer = new PublicKey(employeePubkey).toBuffer();
    
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amountLamports));
    
    const batchBuffer = Buffer.alloc(8);
    batchBuffer.writeBigUInt64LE(BigInt(batchId));
    
    const indexBuffer = Buffer.alloc(4);
    indexBuffer.writeUInt32LE(leafIndex);

    const combined = Buffer.concat([pubkeyBuffer, amountBuffer, batchBuffer, indexBuffer]);
    return sha256(combined);
}

/**
 * ZKPayrollSDK - Client SDK for zkPayroll on Solana
 * 
 * Facilitates interaction with the zkPayroll Anchor contract, Light Protocol ZK compression state,
 * Merkle tree generation, root verification, and batch salary disbursements.
 */
class ZKPayrollSDK {
    /**
     * @param {Object} params
     * @param {Connection} params.connection Solana RPC connection
     * @param {Object} params.wallet Wallet interface with publicKey and signTransaction
     * @param {PublicKey} [params.programId] Custom program ID
     * @param {String} [params.lightProtocolRpcUrl] Light Protocol indexer RPC endpoint
     */
    constructor({ connection, wallet, programId = DEFAULT_PROGRAM_ID, lightProtocolRpcUrl = null }) {
        if (!connection) throw new Error("RPC connection is required.");
        if (!wallet) throw new Error("Wallet instance is required.");

        this.connection = connection;
        this.wallet = wallet;
        this.programId = new PublicKey(programId);
        this.lightProtocolRpcUrl = lightProtocolRpcUrl || connection.rpcEndpoint;
    }

    /**
     * Derives the Payroll Config PDA address.
     * @param {PublicKey} employer
     * @param {Uint8Array|Buffer} payrollId (16 bytes)
     * @returns {[PublicKey, number]} PDA address and bump
     */
    getPayrollConfigPda(employer, payrollId) {
        return PublicKey.findProgramAddressSync(
            [Buffer.from('payroll_config'), employer.toBuffer(), Buffer.from(payrollId)],
            this.programId
        );
    }

    /**
     * Derives the Vault PDA address.
     * @param {PublicKey} employer
     * @param {Uint8Array|Buffer} payrollId (16 bytes)
     * @returns {[PublicKey, number]} PDA address and bump
     */
    getVaultPda(employer, payrollId) {
        return PublicKey.findProgramAddressSync(
            [Buffer.from('vault'), employer.toBuffer(), Buffer.from(payrollId)],
            this.programId
        );
    }

    /**
     * Create a ZK compressed account representation for an employee.
     * Integrates Light Protocol state tree structure abstractions.
     * @param {Object} employee
     * @param {String} employee.pubkey Solana base58 public key
     * @param {Number|BigInt} employee.salaryLamports Salary amount in lamports / base units
     * @param {Number} employee.leafIndex Index in current batch Merkle tree
     * @param {Number} [employee.batchId] Batch ID
     * @returns {Object} Compressed payroll account object
     */
    createCompressedAccount(employee) {
        const batchId = employee.batchId || 1;
        const leafHash = hashPayrollLeaf(employee.pubkey, employee.salaryLamports, batchId, employee.leafIndex);
        
        // Generate pseudo-shielded balance salt for client-side zero-knowledge proof context
        const salt = crypto.randomBytes(32);
        const shieldedAddress = sha256(Buffer.concat([new PublicKey(employee.pubkey).toBuffer(), salt]));

        return {
            employeePubkey: employee.pubkey,
            salaryLamports: employee.salaryLamports,
            batchId,
            leafIndex: employee.leafIndex,
            leafHash: leafHash.toString('hex'),
            leafHashBuffer: leafHash,
            salt: salt.toString('hex'),
            compressedAddress: shieldedAddress.toString('hex'),
            isShielded: true,
            createdAt: new Date().toISOString(),
        };
    }

    /**
     * Builds a Merkle Tree from employee records and returns root & individual proofs.
     * @param {Array<Object>} employees List of employee records
     * @param {Number} [batchId=1]
     * @returns {Object} { root, rootHex, leaves, proofs, treeDepth }
     */
    buildMerkleTree(employees, batchId = 1) {
        if (!employees || employees.length === 0) {
            throw new Error("Employee list cannot be empty.");
        }

        const leaves = employees.map((emp, index) =>
            hashPayrollLeaf(emp.pubkey || emp.employeePubkey, emp.salaryLamports || emp.salaryUSDC * 1e6, batchId, index)
        );

        let currentLevel = leaves.map(l => Buffer.from(l));
        const treeLevels = [currentLevel];

        while (currentLevel.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
                
                const combined = Buffer.compare(left, right) <= 0
                    ? Buffer.concat([left, right])
                    : Buffer.concat([right, left]);

                nextLevel.push(sha256(combined));
            }
            treeLevels.push(nextLevel);
            currentLevel = nextLevel;
        }

        const root = treeLevels[treeLevels.length - 1][0];

        // Generate proof for each leaf
        const proofs = leaves.map((_, leafIdx) => {
            const proof = [];
            let idx = leafIdx;

            for (let layer = 0; layer < treeLevels.length - 1; layer++) {
                const level = treeLevels[layer];
                const isEven = idx % 2 === 0;
                const siblingIdx = isEven ? idx + 1 : idx - 1;

                if (siblingIdx < level.length) {
                    proof.push(Buffer.from(level[siblingIdx]));
                } else {
                    proof.push(Buffer.from(level[idx]));
                }

                idx = Math.floor(idx / 2);
            }
            return proof;
        });

        return {
            root: Buffer.from(root),
            rootHex: Buffer.from(root).toString('hex'),
            leaves,
            proofs,
            treeDepth: treeLevels.length - 1,
            batchSize: employees.length,
        };
    }

    /**
     * Verifies a Merkle inclusion proof against a given root.
     * @param {Buffer|Uint8Array} leaf
     * @param {Array<Buffer|Uint8Array>} proof
     * @param {Buffer|Uint8Array} root
     * @returns {Boolean} True if valid
     */
    verifyProof(leaf, proof, root) {
        let computed = Buffer.from(leaf);
        const rootBuf = Buffer.from(root);

        for (const sibling of proof) {
            const sibBuf = Buffer.from(sibling);
            const combined = Buffer.compare(computed, sibBuf) <= 0
                ? Buffer.concat([computed, sibBuf])
                : Buffer.concat([sibBuf, computed]);
            computed = sha256(combined);
        }

        return computed.equals(rootBuf);
    }

    /**
     * Initializes a new payroll state on-chain.
     * @param {Object} params
     * @param {Uint8Array|Buffer} params.payrollId 16-byte identifier
     * @param {Buffer} params.initialMerkleRoot 32-byte root
     * @param {PublicKey} params.tokenMint SPL token mint address
     * @returns {Promise<String>} Transaction signature
     */
    async initialize({ payrollId, initialMerkleRoot, tokenMint }) {
        const employer = this.wallet.publicKey;
        const [payrollConfigPda] = this.getPayrollConfigPda(employer, payrollId);
        const [vaultPda] = this.getVaultPda(employer, payrollId);

        // Instruction discriminator for "initialize_payroll" (Anchor 8-byte discriminator)
        // sha256("global:initialize_payroll")[..8]
        const discriminator = crypto.createHash('sha256').update('global:initialize_payroll').digest().slice(0, 8);

        const data = Buffer.concat([
            discriminator,
            Buffer.from(payrollId),
            Buffer.from(initialMerkleRoot),
        ]);

        const keys = [
            { pubkey: employer, isSigner: true, isWritable: true },
            { pubkey: payrollConfigPda, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(tokenMint), isSigner: false, isWritable: false },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ];

        const instruction = new TransactionInstruction({
            keys,
            programId: this.programId,
            data,
        });

        const tx = new Transaction().add(instruction);
        tx.feePayer = employer;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

        const signedTx = await this.wallet.signTransaction(tx);
        const rawTx = signedTx.serialize();
        return await this.connection.sendRawTransaction(rawTx);
    }

    /**
     * Updates the registered Merkle root on-chain.
     * @param {Object} params
     * @param {Uint8Array|Buffer} params.payrollId
     * @param {Buffer} params.newMerkleRoot
     * @param {Number} params.totalEmployees
     * @returns {Promise<String>} Transaction signature
     */
    async updateMerkleRoot({ payrollId, newMerkleRoot, totalEmployees }) {
        const employer = this.wallet.publicKey;
        const [payrollConfigPda] = this.getPayrollConfigPda(employer, payrollId);

        const discriminator = crypto.createHash('sha256').update('global:update_merkle_root').digest().slice(0, 8);

        const empCountBuffer = Buffer.alloc(4);
        empCountBuffer.writeUInt32LE(totalEmployees);

        const data = Buffer.concat([
            discriminator,
            Buffer.from(newMerkleRoot),
            empCountBuffer,
        ]);

        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: employer, isSigner: true, isWritable: false },
                { pubkey: payrollConfigPda, isSigner: false, isWritable: true },
            ],
            programId: this.programId,
            data,
        });

        const tx = new Transaction().add(instruction);
        tx.feePayer = employer;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

        const signedTx = await this.wallet.signTransaction(tx);
        return await this.connection.sendRawTransaction(signedTx.serialize());
    }

    /**
     * Executes batch payroll transfers to multiple recipient compressed token accounts.
     * @param {Object} params
     * @param {Uint8Array|Buffer} params.payrollId
     * @param {Object} params.merkleTree Built Merkle tree object from buildMerkleTree
     * @param {Array<Object>} params.payrollBatch Array of employee records ({pubkey, salaryLamports})
     * @param {Number} [params.batchId=1]
     * @returns {Promise<String>} Transaction signature
     */
    async executeBatchPayout({ payrollId, merkleTree, payrollBatch, batchId = 1 }) {
        const employer = this.wallet.publicKey;
        const [payrollConfigPda] = this.getPayrollConfigPda(employer, payrollId);
        const [vaultPda] = this.getVaultPda(employer, payrollId);

        const discriminator = crypto.createHash('sha256').update('global:execute_batch_payout').digest().slice(0, 8);

        let totalAmount = 0n;
        const amounts = [];
        const recipientKeys = [];

        payrollBatch.forEach(item => {
            const amt = BigInt(item.salaryLamports || item.salaryUSDC * 1e6);
            totalAmount += amt;
            amounts.push(amt);
            recipientKeys.push(new PublicKey(item.pubkey));
        });

        // Encode BatchPayoutHeader struct
        // merkle_root: [u8; 32], total_amount: u64, batch_id: u64, batch_size: u32
        const headerBuf = Buffer.alloc(32 + 8 + 8 + 4);
        Buffer.from(merkleTree.root).copy(headerBuf, 0);
        headerBuf.writeBigUInt64LE(totalAmount, 32);
        headerBuf.writeBigUInt64LE(BigInt(batchId), 40);
        headerBuf.writeUInt32LE(payrollBatch.length, 48);

        // Encode proofs Vec<Vec<[u8; 32]>>
        const proofsParts = [Buffer.alloc(4)];
        proofsParts[0].writeUInt32LE(merkleTree.proofs.length, 0);

        merkleTree.proofs.forEach(singleProof => {
            const lenBuf = Buffer.alloc(4);
            lenBuf.writeUInt32LE(singleProof.length, 0);
            proofsParts.push(lenBuf);
            singleProof.forEach(node => proofsParts.push(Buffer.from(node)));
        });
        const proofsBuf = Buffer.concat(proofsParts);

        // Encode amounts Vec<u64>
        const amountsParts = [Buffer.alloc(4)];
        amountsParts[0].writeUInt32LE(amounts.length, 0);
        amounts.forEach(amt => {
            const b = Buffer.alloc(8);
            b.writeBigUInt64LE(amt);
            amountsParts.push(b);
        });
        const amountsBuf = Buffer.concat(amountsParts);

        // Encode recipients Vec<Pubkey>
        const recipientsParts = [Buffer.alloc(4)];
        recipientsParts[0].writeUInt32LE(recipientKeys.length, 0);
        recipientKeys.forEach(pk => recipientsParts.push(pk.toBuffer()));
        const recipientsBuf = Buffer.concat(recipientsParts);

        const data = Buffer.concat([discriminator, headerBuf, proofsBuf, amountsBuf, recipientsBuf]);

        const keys = [
            { pubkey: employer, isSigner: true, isWritable: false },
            { pubkey: payrollConfigPda, isSigner: false, isWritable: true },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ];

        // Remaining accounts for recipient token accounts
        recipientKeys.forEach(recipient => {
            keys.push({ pubkey: recipient, isSigner: false, isWritable: true });
        });

        const instruction = new TransactionInstruction({
            keys,
            programId: this.programId,
            data,
        });

        const tx = new Transaction().add(instruction);
        tx.feePayer = employer;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

        const signedTx = await this.wallet.signTransaction(tx);
        return await this.connection.sendRawTransaction(signedTx.serialize());
    }

    /**
     * Executes single salary claim for an employee with inclusion proof.
     * @param {Object} params
     * @param {PublicKey} params.employerPubkey
     * @param {Uint8Array|Buffer} params.payrollId
     * @param {Number|BigInt} params.amount
     * @param {Number} params.leafIndex
     * @param {Number} [params.batchId=1]
     * @param {Array<Buffer>} params.proof
     * @param {PublicKey} params.employeeTokenAccount
     * @returns {Promise<String>} Transaction signature
     */
    async claimSalary({ employerPubkey, payrollId, amount, leafIndex, batchId = 1, proof, employeeTokenAccount }) {
        const employee = this.wallet.publicKey;
        const [payrollConfigPda] = this.getPayrollConfigPda(employerPubkey, payrollId);
        const [vaultPda] = this.getVaultPda(employerPubkey, payrollId);

        const discriminator = crypto.createHash('sha256').update('global:claim_salary').digest().slice(0, 8);

        const amountBuf = Buffer.alloc(8);
        amountBuf.writeBigUInt64LE(BigInt(amount));

        const indexBuf = Buffer.alloc(4);
        indexBuf.writeUInt32LE(leafIndex);

        const batchBuf = Buffer.alloc(8);
        batchBuf.writeBigUInt64LE(BigInt(batchId));

        const proofLenBuf = Buffer.alloc(4);
        proofLenBuf.writeUInt32LE(proof.length);
        const proofParts = [proofLenBuf];
        proof.forEach(node => proofParts.push(Buffer.from(node)));

        const data = Buffer.concat([discriminator, amountBuf, indexBuf, batchBuf, Buffer.concat(proofParts)]);

        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: employee, isSigner: true, isWritable: true },
                { pubkey: payrollConfigPda, isSigner: false, isWritable: false },
                { pubkey: vaultPda, isSigner: false, isWritable: true },
                { pubkey: new PublicKey(employeeTokenAccount), isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: this.programId,
            data,
        });

        const tx = new Transaction().add(instruction);
        tx.feePayer = employee;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

        const signedTx = await this.wallet.signTransaction(tx);
        return await this.connection.sendRawTransaction(signedTx.serialize());
    }

    /**
     * Fetches current payroll state account from Solana RPC.
     * @param {PublicKey} payrollConfigPda
     * @returns {Promise<Object>} Decoded state object
     */
    async fetchPayrollState(payrollConfigPda) {
        const accountInfo = await this.connection.getAccountInfo(new PublicKey(payrollConfigPda));
        if (!accountInfo) {
            throw new Error("Payroll account not found on-chain.");
        }

        const data = accountInfo.data;
        // Skip 8-byte Anchor discriminator
        const employer = new PublicKey(data.slice(8, 40));
        const payrollId = data.slice(40, 56);
        const merkleRoot = data.slice(56, 88);
        const totalEmployees = data.readUInt32LE(88);
        const totalPayoutCount = data.readBigUInt64LE(92);
        const totalTokensDistributed = data.readBigUInt64LE(100);
        const isPaused = Boolean(data[108]);

        return {
            employer: employer.toBase58(),
            payrollId: payrollId.toString('hex'),
            merkleRoot: merkleRoot.toString('hex'),
            totalEmployees,
            totalPayoutCount: totalPayoutCount.toString(),
            totalTokensDistributed: totalTokensDistributed.toString(),
            isPaused,
        };
    }
}

module.exports = {
    ZKPayrollSDK,
    hashPayrollLeaf,
    sha256,
};
