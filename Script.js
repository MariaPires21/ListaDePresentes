// CONFIGURAÇÃO DO JSONBIN - PARA TODOS VEREM A MESMA LISTA
const JSONBIN_ID = '690fb6ccae596e708f4d14d8';
const MASTER_KEY = '$2a$10$Tmtgh0S3ERmxdctqZ3dtxOhLISS.q6g6v6gBhisR4BFJxG0oOsuB6';

// Elementos da interface
const tabBtns = document.querySelectorAll('.tab-btn');
const formSection = document.getElementById('form');
const viewSection = document.getElementById('view');
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

// Nome do usuário atual (vamos pedir uma vez)
let currentUserName = '';

// Pedir nome ao carregar a página
function askUserName() {
    if (!currentUserName) {
        currentUserName = prompt('🎄 Qual é o seu nome? (Para gerenciar seus desejos)') || '';
    }
    return currentUserName;
}

// Alternar entre abas
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabId = btn.getAttribute('data-tab');
        formSection.classList.remove('active');
        viewSection.classList.remove('active');

        if (tabId === 'form') {
            formSection.classList.add('active');
        } else {
            viewSection.classList.add('active');
            loadWishes();
        }
    });
});

// Carregar desejos do JSONBin
async function loadWishes() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });
        
        const data = await response.json();
        const wishes = data.record?.wishes || [];

        if (wishes.length === 0) {
            wishList.innerHTML = `
                <div class="empty-state">
                    <div>📝</div>
                    <h3>Nenhum desejo adicionado ainda</h3>
                    <p>Seja o primeiro a compartilhar seus desejos de Natal!</p>
                </div>
            `;
            return;
        }

        wishList.innerHTML = '';
        wishes.forEach((wish, index) => {
            const wishCard = document.createElement('div');
            wishCard.className = 'wish-card';
            wishCard.setAttribute('data-wish-index', index);

            let imageHtml = '';
            
            if (wish.images && wish.images.length > 0) {
                // MÚLTIPLAS IMAGENS - Carrossel
                imageHtml = `
                    <div class="wish-images-container">
                        ${wish.images.map((image, imgIndex) => `
                            <div class="image-wrapper ${imgIndex === 0 ? 'active' : ''}" 
                                 style="display: ${imgIndex === 0 ? 'flex' : 'none'}"
                                 data-image-index="${imgIndex}">
                                <img src="${image}" 
                                     alt="Presente ${imgIndex + 1} desejado por ${wish.name}" 
                                     class="wish-image"
                                     onload="handleImageLoad(this)">
                            </div>
                        `).join('')}
                        
                        ${wish.images.length > 1 ? `
                            <div class="image-counter">
                                <span class="current-image">1</span> / <span class="total-images">${wish.images.length}</span>
                            </div>
                            <button class="nav-btn prev-btn" onclick="navigateImages(${index}, -1)">‹</button>
                            <button class="nav-btn next-btn" onclick="navigateImages(${index}, 1)">›</button>
                        ` : ''}
                    </div>
                `;
            } else if (wish.image) {
                // UMA ÚNICA IMAGEM (compatibilidade)
                imageHtml = `
                    <div class="wish-images-container">
                        <div class="image-wrapper active" style="display: flex">
                            <img src="${wish.image}" 
                                 alt="Presente desejado por ${wish.name}" 
                                 class="wish-image"
                                 onload="handleImageLoad(this)">
                        </div>
                    </div>
                `;
            } else {
                // SEM IMAGEM
                imageHtml = `
                    <div class="wish-images-container">
                        <div class="no-image-placeholder">
                            <div class="gift-emoji">🎁</div>
                            <div class="no-image-text">Sem imagem</div>
                        </div>
                    </div>
                `;
            }

            // VERIFICAR SE É O DESEJO DO USUÁRIO ATUAL
            const isCurrentUserWish = currentUserName && 
                                    wish.name.toLowerCase() === currentUserName.toLowerCase();
            
            const deleteButton = isCurrentUserWish ? 
                `<button class="delete-btn" onclick="deleteWish('${wish.name}')" title="Apagar meu desejo">🗑️</button>` : 
                '';

            wishCard.innerHTML = `
                ${imageHtml}
                <div class="wish-info">
                    <div class="wish-header">
                        <div class="wish-name">${wish.name}</div>
                        ${deleteButton}
                    </div>
                    <div class="wish-description">${wish.wish}</div>
                    ${wish.images && wish.images.length > 1 ? `
                        <small class="photos-hint">
                            📸 ${wish.images.length} foto(s) - Use as setas para navegar
                        </small>
                    ` : ''}
                    <small class="wish-date">Adicionado em: ${new Date(wish.date).toLocaleDateString('pt-BR')}</small>
                </div>
            `;

            wishList.appendChild(wishCard);
        });
    } catch (error) {
        console.error('Erro ao carregar desejos:', error);
        wishList.innerHTML = `
            <div class="empty-state">
                <div>❌</div>
                <h3>Erro ao carregar desejos</h3>
                <p>Tente recarregar a página.</p>
            </div>
        `;
    }
}

// FUNÇÃO PARA APAGAR DESEJO (APENAS O PRÓPRIO)
async function deleteWish(name) {
    // Verificar novamente se é o desejo do usuário atual
    if (name.toLowerCase() !== currentUserName.toLowerCase()) {
        alert('❌ Você só pode apagar seu próprio desejo!');
        return;
    }

    if (!confirm(`Tem certeza que deseja apagar SEU desejo, ${name}?`)) {
        return;
    }

    try {
        // Carregar desejos existentes
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });
        
        const data = await response.json();
        let wishes = data.record?.wishes || [];

        // Encontrar e remover o desejo
        const wishIndex = wishes.findIndex(item => 
            item.name.toLowerCase() === name.toLowerCase() && 
            name.toLowerCase() === currentUserName.toLowerCase()
        );
        
        if (wishIndex !== -1) {
            wishes.splice(wishIndex, 1);
            
            // Salvar no JSONBin
            const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': MASTER_KEY
                },
                body: JSON.stringify({ wishes: wishes })
            });

            if (updateResponse.ok) {
                alert(`✅ Seu desejo foi apagado com sucesso!`);
                loadWishes(); // Recarregar a lista
            } else {
                throw new Error('Erro ao salvar no JSONBin');
            }
        } else {
            alert('❌ Desejo não encontrado ou você não tem permissão para apagá-lo!');
        }

    } catch (error) {
        console.error('Erro ao apagar desejo:', error);
        alert('❌ Erro ao apagar desejo. Tente novamente.');
    }
}

// Função para centralizar imagens verticais
function handleImageLoad(imgElement) {
    const wrapper = imgElement.parentElement;
    
    // Verificar se a imagem é vertical
    if (imgElement.naturalHeight > imgElement.naturalWidth) {
        wrapper.classList.add('vertical-image');
    } else {
        wrapper.classList.add('horizontal-image');
    }
}

// Navegação entre imagens
function navigateImages(wishIndex, direction) {
    const wishCard = document.querySelector(`[data-wish-index="${wishIndex}"]`);
    const container = wishCard.querySelector('.wish-images-container');
    const wrappers = container.querySelectorAll('.image-wrapper');
    const currentIndex = Array.from(wrappers).findIndex(wrapper => wrapper.style.display === 'flex');
    const totalImages = wrappers.length;
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = totalImages - 1;
    if (newIndex >= totalImages) newIndex = 0;
    
    // Esconder todas as imagens
    wrappers.forEach(wrapper => wrapper.style.display = 'none');
    // Mostrar apenas a imagem atual
    wrappers[newIndex].style.display = 'flex';
    
    // Atualizar contador
    const counter = container.querySelector('.current-image');
    if (counter) {
        counter.textContent = newIndex + 1;
    }
}

// Processar envio do formulário
wishForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const wish = document.getElementById('wish').value.trim();
    const imageFiles = document.getElementById('image').files;

    // Validação básica
    if (!name || !wish) {
        alert('Por favor, preencha seu nome e seu desejo!');
        return;
    }

    // Se não tem nome salvo, usar o nome do formulário
    if (!currentUserName) {
        currentUserName = name;
    }

    try {
        let imagesBase64 = [];
        
        if (imageFiles.length > 0) {
            // Processar múltiplas imagens
            for (let i = 0; i < imageFiles.length; i++) {
                if (imageFiles[i].size > 2 * 1024 * 1024) {
                    alert(`A imagem ${i + 1} é muito grande! Por favor, escolha imagens menores que 2MB.`);
                    return;
                }

                const compressedImage = await fileToBase64(imageFiles[i]);
                imagesBase64.push(compressedImage);
                
                // Limitar a 5 imagens no máximo
                if (imagesBase64.length >= 5) {
                    alert('⚠️ Máximo de 5 imagens atingido. As demais serão ignoradas.');
                    break;
                }
            }
        }

        // Carregar desejos existentes do JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });
        
        const data = await response.json();
        let wishes = data.record?.wishes || [];

        // Verificar se já existe um desejo com este nome
        const existingIndex = wishes.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

        if (existingIndex !== -1) {
            if (!confirm(`${name}, você já adicionou um desejo. Deseja substituí-lo?`)) {
                return;
            }
            wishes.splice(existingIndex, 1);
        }

        // Adicionar novo desejo
        const newWish = {
            name: name,
            wish: wish,
            date: new Date().toISOString()
        };

        // Adicionar imagens
        if (imagesBase64.length > 0) {
            newWish.images = imagesBase64;
        }

        wishes.push(newWish);

        // Salvar no JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify({ wishes: wishes })
        });

        if (updateResponse.ok) {
            alert(`🎄 Seu desejo foi adicionado com sucesso! ${imagesBase64.length > 0 ? `(${imagesBase64.length} foto(s))` : ''}`);
            wishForm.reset();
            document.querySelector('[data-tab="view"]').click();
        } else {
            throw new Error('Erro ao salvar no JSONBin');
        }

    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao enviar desejo. Tente novamente.');
    }
});

// CONVERTER IMAGEM PARA BASE64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const MAX_SIZE = 400;
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > MAX_SIZE) {
                    height = (height * MAX_SIZE) / width;
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = (width * MAX_SIZE) / height;
                    height = MAX_SIZE;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                resolve(compressedBase64);
            };
            
            img.onerror = function() {
                resolve(e.target.result);
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Carregar desejos ao abrir a página
document.addEventListener('DOMContentLoaded', function() {
    askUserName();
    loadWishes();
});