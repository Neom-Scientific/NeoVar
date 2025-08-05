const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');
const { fetchScriptsFromAWS } = require('./fetchScriptsFromAWS'); // Adjust path if needed

const systems = [
    { host: '192.168.1.16', user: 'manas', os: 'linux', output_dir: '/dev/shm', port: 22 },
    { host: '192.168.1.2', user: 'strive', os: 'linux', output_dir: '/dev/shm', port: 2222 },
    { host: '192.168.1.10', user: 'hp', os: 'windows-wsl', output_dir: '/dev/shm', port: 22 },
];

// Helper: Upload a file to the remote server
function uploadFileToServer(server, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(localPath, remotePath, (err) => {
                    conn.end();
                    if (err) return reject(err);
                    resolve();
                });
            });
        }).connect({
            host: server.host,
            port: server.port,
            username: server.user,
            privateKey: fs.readFileSync('/home/strive/.ssh/id_rsa')
        });
    });
}

// Main workflow for server_mode
async function runJobOnServerServerMode() {
    const server = systems[1]; // Select your server
    const projectName = 'project_1';
    const remoteDir = path.join(server.output_dir, projectName);

    // 1. Fetch scripts/targets from AWS to local temp
    const tempDir = '/tmp/servermode';
    fs.mkdirSync(tempDir, { recursive: true });

    const callBatchPath = await fetchScriptsFromAWS('resources/call_batch.sh', tempDir);
    const neoVarPath = await fetchScriptsFromAWS('resources/NeoVar.sh', tempDir);
    const targetPath = await fetchScriptsFromAWS('resources/Exome.hg38.target.vC1.bed', tempDir);
    const intervalPath = await fetchScriptsFromAWS('resources/Exome.hg38.target.vC1.interval_list', tempDir);

    // 2. Upload files to remote server
    await uploadFileToServer(server, callBatchPath, path.join(remoteDir, 'call_batch.sh'));
    await uploadFileToServer(server, neoVarPath, path.join(remoteDir, 'NeoVar.sh'));
    await uploadFileToServer(server, targetPath, path.join(remoteDir, 'target.bed'));
    await uploadFileToServer(server, intervalPath, path.join(remoteDir, 'interval_list'));

    // (Optional) Upload inputDir files if needed

    // 3. Run analysis script remotely
    const analysisCmd = `bash ${path.join(remoteDir, 'call_batch.sh')} ${path.join(remoteDir, 'NeoVar.sh')} ${remoteDir}/inputDir ${remoteDir}/outputDir ${remoteDir}/target.bed ${remoteDir}/interval_list ${remoteDir}/localDir > ${remoteDir}/output.txt 2>&1`;

    const conn = new Client();
    return new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.exec(`mkdir -p ${remoteDir} && ${analysisCmd}`, (err, stream) => {
                if (err) return reject(err);
                stream
                    .on('close', (code) => {
                        conn.end();
                        resolve({ success: true, code, server: server.host });
                    })
                    .on('data', data => console.log(`[${server.host}] STDOUT: ${data}`))
                    .stderr.on('data', data => console.error(`[${server.host}] STDERR: ${data}`));
            });
        });
        conn.connect({
            host: server.host,
            port: server.port,
            username: server.user,
            privateKey: fs.readFileSync('/home/strive/.ssh/id_rsa')
        });
    });
}

runJobOnServerServerMode().then(console.log).catch(console.error);