// KeyCloud - Script principal
// Responsável por gerenciar o upload de arquivos para o Supabase Storage

// Elementos DOM
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const fileSelectBtn = document.getElementById('file-select-btn');
const uploadBtn = document.getElementById('upload-btn');
const cancelBtn = document.getElementById('cancel-btn');
const filesContainer = document.getElementById('files-container');
const fileList = document.getElementById('file-list');
const uploadStatus = document.getElementById('upload-status');
const uploadProgress = document.getElementById('upload-progress');
const statusMessage = document.getElementById('status-message');
const bucketNameElement = document.getElementById('bucket-name');
const userIdElement = document.getElementById('user-id');

// Variáveis globais
let filesToUpload = [];
let supabaseUrl = 'https://supabase.co';
let token = '';
let userId = '';
let bucketName = '';
let activeUploads = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Inicializa a aplicação lendo os parâmetros da URL
function initializeApp() {
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token');
    userId = urlParams.get('user_id');
    bucketName = urlParams.get('bucket');

    // Verificar se todos os parâmetros necessários estão presentes
    if (!token || !userId || !bucketName) {
        showError('Parâmetros insuficientes na URL. Verifique se você está usando o pendrive corretamente.');
        return;
    }

    // Exibir informações do usuário na interface
    bucketNameElement.textContent = bucketName;
    userIdElement.textContent = userId;
}

// Configura os event listeners
function setupEventListeners() {
    // Botão de seleção de arquivos
    fileSelectBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Área de drag and drop
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('highlight');
        handleFiles(e.dataTransfer.files);
    });

    // Input de arquivo
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });

    // Botão de upload
    uploadBtn.addEventListener('click', startUpload);

    // Botão de cancelar
    cancelBtn.addEventListener('click', cancelSelection);
}

// Processa os arquivos selecionados
function handleFiles(files) {
    if (files.length === 0) return;

    filesToUpload = Array.from(files);
    filesContainer.classList.remove('hidden');
    renderFileList();
}

// Renderiza a lista de arquivos selecionados
function renderFileList() {
    fileList.innerHTML = '';
    
    filesToUpload.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="flex-1 pr-4">
                <div class="font-medium text-gray-800">${file.name}</div>
                <div class="text-sm text-gray-500">${formatFileSize(file.size)}</div>
            </div>
            <button class="remove-file-btn text-red-500 hover:text-red-700" data-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        fileList.appendChild(fileItem);
        
        // Adicionar evento de remoção
        const removeBtn = fileItem.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', () => {
            filesToUpload.splice(index, 1);
            renderFileList();
            if (filesToUpload.length === 0) {
                filesContainer.classList.add('hidden');
            }
        });
    });
}

// Formata o tamanho do arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Inicia o processo de upload
function startUpload() {
    if (filesToUpload.length === 0) return;
    
    uploadBtn.disabled = true;
    cancelBtn.disabled = true;
    uploadStatus.classList.remove('hidden');
    uploadProgress.innerHTML = '';
    activeUploads = [];
    
    // Criar elementos de progresso para cada arquivo
    filesToUpload.forEach((file, index) => {
        const progressElement = document.createElement('div');
        progressElement.className = 'mb-4';
        progressElement.innerHTML = `
            <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">${file.name}</span>
                <span class="text-sm text-gray-500" id="progress-text-${index}">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress" id="progress-bar-${index}" style="width: 0%"></div>
            </div>
        `;
        uploadProgress.appendChild(progressElement);
        
        // Iniciar upload para este arquivo
        uploadFile(file, index);
    });
}

// Realiza o upload de um arquivo para o Supabase Storage
async function uploadFile(file, index) {
    try {
        // Gerar um nome de arquivo único baseado no timestamp e nome original
        const timestamp = new Date().getTime();
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `${timestamp}_${file.name}`;
        const path = `${userId}/${uniqueFileName}`;
        
        // Preparar o upload
        const url = `https://supabase.co/storage/v1/object/${bucketName}/${path}`;
        
        // Criar o objeto XMLHttpRequest para monitorar o progresso
        const xhr = new XMLHttpRequest();
        activeUploads.push(xhr);
        
        // Configurar eventos de progresso
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                updateProgress(index, percentComplete);
            }
        });
        
        // Configurar o evento de conclusão
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                updateProgress(index, 100);
                checkAllUploadsComplete();
            } else {
                handleUploadError(index, xhr.statusText);
            }
        });
        
        // Configurar o evento de erro
        xhr.addEventListener('error', () => {
            handleUploadError(index, 'Erro na conexão');
        });
        
        // Configurar o evento de cancelamento
        xhr.addEventListener('abort', () => {
            handleUploadError(index, 'Upload cancelado');
        });
        
        // Iniciar o request
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
        
    } catch (error) {
        handleUploadError(index, error.message);
    }
}

// Atualiza a barra de progresso de um arquivo
function updateProgress(index, percent) {
    const progressBar = document.getElementById(`progress-bar-${index}`);
    const progressText = document.getElementById(`progress-text-${index}`);
    
    if (progressBar && progressText) {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }
}

// Verifica se todos os uploads foram concluídos
function checkAllUploadsComplete() {
    const completed = activeUploads.every(xhr => xhr.readyState === 4);
    if (completed) {
        showSuccess('Todos os arquivos foram enviados com sucesso!');
        uploadBtn.disabled = false;
        cancelBtn.disabled = false;
        
        // Limpar a lista de arquivos
        setTimeout(() => {
            filesToUpload = [];
            filesContainer.classList.add('hidden');
            uploadStatus.classList.add('hidden');
        }, 3000);
    }
}

// Trata erros de upload
function handleUploadError(index, errorMessage) {
    const progressText = document.getElementById(`progress-text-${index}`);
    if (progressText) {
        progressText.textContent = 'Erro';
        progressText.classList.add('text-red-600');
    }
    
    showError(`Erro ao enviar o arquivo: ${errorMessage}`);
    uploadBtn.disabled = false;
    cancelBtn.disabled = false;
}

// Cancela a seleção atual de arquivos
function cancelSelection() {
    filesToUpload = [];
    filesContainer.classList.add('hidden');
    fileList.innerHTML = '';
}

// Mostra mensagem de erro
function showError(message) {
    statusMessage.textContent = message;
    statusMessage.className = 'mb-4 p-4 rounded-md bg-red-100 text-red-700';
    statusMessage.classList.remove('hidden');
    
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 5000);
}

// Mostra mensagem de sucesso
function showSuccess(message) {
    statusMessage.textContent = message;
    statusMessage.className = 'mb-4 p-4 rounded-md bg-green-100 text-green-700';
    statusMessage.classList.remove('hidden');
    
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 5000);
}
