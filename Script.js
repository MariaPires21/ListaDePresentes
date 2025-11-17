// CONFIGURAÇÃO DO JSONBIN - PARA TODOS VEREM A MESMA LISTA
const JSONBIN_ID = '690fb6ccae596e708f4d14d8';
const MASTER_KEY = '$2a$10$Tmtgh0S3ERmxdctqZ3dtxOhLISS.q6g6v6gBhisR4BFJxG0oOsuB6';

// Elementos da interface
const tabBtns = document.querySelectorAll('.tab-btn');
const formSection = document.getElementById('form');
const viewSection = document.getElementById('view');
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

// Nome do usuário atual
let currentUserName = '';

// INICIALIZAR USUÁRIO - OPÇÃO 4 (Sempre verificar)
function initializeUser() {
    const savedName = localStorage.getItem('currentUserName') || '';

    let message = '🎄 Qual é o seu nome?';
    if (savedName) {
        message = `🎄 Quem está acessando?\n- Digite "${savedName}" para continuar\n- Ou digite outro nome para trocar`;
    }

    const userName = prompt(message) || '';

    if (userName.trim()) {
        currentUserName = userName.trim();
        localStorage.setItem('currentUserName', currentUserName);

        if (savedName && userName.trim().toLowerCase() === savedName.toLowerCase()) {
            console.log('✅ Usuário confirmado:', currentUserName);
        } else if (savedName) {
            console.log('🔄 Usuário trocado:', savedName, '→', currentUserName);
        } else {
            console.log('✅ Novo usuário:', currentUserName);
        }
    } else {
        currentUserName = savedName || 'Visitante';
        console.log('⚠️ Usando:', currentUserName);
    }
}

// EXECUTAR VERIFICAÇÃO IMEDIATAMENTE
initializeUser();

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

// CARREGAR DESEJOS DO JSONBIN - TODOS VEEM A MESMA LISTA
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

        wishes.forEach((wish, wishIndex) => {
            const wishCard = document.createElement('div');
            wishCard.className = 'wish-card';
            wishCard.setAttribute('data-wish-index', wishIndex);

            let imageHtml = '';
            const images = wish.images || (wish.image ? [wish.image] : []);

            if (images.length > 0) {
                imageHtml = `
                    <div class="wish-images-container">
                        ${images.map((image, imgIndex) => `
                            <div class="image-wrapper ${imgIndex === 0 ? 'active' : ''}" 
                                 style="display: ${imgIndex === 0 ? 'flex' : 'none'}">
                                <img src="${image}" 
                                     alt="Presente de ${wish.name}" 
                                     class="wish-image"
                                     onerror="this.style.display='none'">
                            </div>
                        `).join('')}
                        
                        ${images.length > 1 ? `
                            <div class="image-counter">1/${images.length}</div>
                            <button class="nav-btn prev-btn" onclick="navigateImages(${wishIndex}, -1)">‹</button>
                            <button class="nav-btn next-btn" onclick="navigateImages(${wishIndex}, 1)">›</button>
                        ` : ''}
                    </div>
                `;
            } else {
                imageHtml = `
                    <div class="wish-images-container">
                        <div class="no-image-placeholder">
                            <div class="gift-emoji">🎁</div>
                            <div class="no-image-text">Sem imagem</div>
                        </div>
                    </div>
                `;
            }

            // Botão apagar apenas para o próprio usuário
            const isMyWish = currentUserName && wish.name.toLowerCase() === currentUserName.toLowerCase();
            const deleteBtn = isMyWish ? `<button class="delete-btn" onclick="deleteWish('${wish.name}')">🗑️</button>` : '';

            wishCard.innerHTML = `
                ${imageHtml}
                <div class="wish-info">
                    <div class="wish-header">
                        <div class="wish-name">${wish.name}</div>
                        ${deleteBtn}
                    </div>
                    <div class="wish-description">${wish.wish}</div>
                    ${images.length > 1 ? `<small class="photos-hint">📸 ${images.length} fotos - Use as setas</small>` : ''}
                    <small class="wish-date">Adicionado em: ${new Date(wish.date).toLocaleDateString('pt-BR')}</small>
                </div>
            `;

            wishList.appendChild(wishCard);
        });
    } catch (error) {
        console.error('❌ Erro ao carregar desejos:', error);
        wishList.innerHTML = `
            <div class="empty-state">
                <div>❌</div>
                <h3>Erro ao carregar desejos</h3>
                <p>Tente recarregar a página.</p>
            </div>
        `;
    }
}

// Navegar entre imagens
function navigateImages(wishIndex, direction) {
    const wishCard = document.querySelector(`[data-wish-index="${wishIndex}"]`);
    if (!wishCard) return;

    const container = wishCard.querySelector('.wish-images-container');
    const wrappers = container.querySelectorAll('.image-wrapper');
    let currentIndex = 0;

    wrappers.forEach((wrapper, index) => {
        if (wrapper.style.display === 'flex') currentIndex = index;
    });

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = wrappers.length - 1;
    if (newIndex >= wrappers.length) newIndex = 0;

    wrappers.forEach(wrapper => wrapper.style.display = 'none');
    wrappers[newIndex].style.display = 'flex';

    const counter = container.querySelector('.image-counter');
    if (counter) counter.textContent = `${newIndex + 1}/${wrappers.length}`;
}

// APAGAR DESEJO DO JSONBIN
async function deleteWish(name) {
    if (name.toLowerCase() !== currentUserName.toLowerCase()) {
        alert('❌ Você só pode apagar seu próprio desejo!');
        return;
    }

    if (!confirm(`Tem certeza que deseja apagar SEU desejo, ${name}?`)) return;

    try {
        // Carregar lista atual
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });

        const data = await response.json();
        let wishes = data.record?.wishes || [];

        // Remover desejo
        const newWishes = wishes.filter(wish => wish.name.toLowerCase() !== name.toLowerCase());

        // Salvar no JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify({ wishes: newWishes })
        });

        if (updateResponse.ok) {
            alert('✅ Seu desejo foi apagado!');
            loadWishes(); // Recarregar lista
        } else {
            throw new Error('Erro ao salvar');
        }
    } catch (error) {
        console.error('❌ Erro ao apagar:', error);
        alert('❌ Erro ao apagar desejo.');
    }
}

// Comprimir imagem
function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 10 * 1024 * 1024) {
            alert('❌ Imagem muito grande! Escolha uma menor que 10MB.');
            reject('Imagem grande');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
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
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ENVIAR FORMULÁRIO PARA JSONBIN
wishForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const wishText = document.getElementById('wish').value.trim();
    const imageFiles = document.getElementById('image').files;

    if (!name || !wishText) {
        alert('Preencha nome e desejo!');
        return;
    }

    // Verificar se o nome do formulário bate com o usuário logado
    if (name.toLowerCase() !== currentUserName.toLowerCase()) {
        if (!confirm(`⚠️ Você está logado como "${currentUserName}" mas está tentando adicionar como "${name}".\n\nDeseja continuar?`)) {
            return;
        }
    }

    try {
        let imagesBase64 = [];

        if (imageFiles.length > 0) {
            // Mostrar feedback
            const submitButton = wishForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '⏳ Processando imagens...';
            submitButton.disabled = true;

            // Processar cada imagem
            for (let i = 0; i < imageFiles.length; i++) {
                if (imagesBase64.length >= 5) {
                    alert('⚠️ Máximo de 5 imagens atingido!');
                    break;
                }
                try {
                    const compressed = await compressImage(imageFiles[i]);
                    imagesBase64.push(compressed);
                } catch (error) {
                    console.log('Erro na imagem:', error);
                    alert(`❌ Erro na imagem ${i + 1}. Tente outra.`);
                }
            }

            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }

        // CARREGAR LISTA ATUAL DO JSONBIN
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });

        const data = await response.json();
        let wishes = data.record?.wishes || [];

        // Verificar se já existe
        const existingIndex = wishes.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

        if (existingIndex !== -1) {
            if (!confirm(`${name}, você já adicionou um desejo. Deseja substituí-lo?`)) return;
            wishes.splice(existingIndex, 1);
        }

        const newWish = {
            name: name,
            wish: wishText,
            date: new Date().toISOString()
        };

        if (imagesBase64.length > 0) {
            newWish.images = imagesBase64;
        }

        wishes.push(newWish);

        // SALVAR NO JSONBIN
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify({ wishes: wishes })
        });

        if (updateResponse.ok) {
            alert('🎄 Desejo adicionado com sucesso!' + (imagesBase64.length ? ` (${imagesBase64.length} foto(s))` : ''));
            wishForm.reset();
            document.querySelector('[data-tab="view"]').click();
        } else {
            throw new Error('Erro ao salvar no JSONBin');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
        alert('❌ Erro ao adicionar desejo.');
    }
});

// Carregar inicial
document.addEventListener('DOMContentLoaded', loadWishes);