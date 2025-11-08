// Configuração do JSONBin.io
const JSONBIN_ID = '690fb6ccae596e708f4d14d8'; // Você vai conseguir isso no passo 3
const MASTER_KEY = '$2a$10$Tmtgh0S3ERmxdctqZ3dtxOhLISS.q6g6v6gBhisR4BFJxG0oOsuB6'; // Você vai conseguir isso no passo 3

// Elementos da interface
const tabBtns = document.querySelectorAll('.tab-btn');
const formSection = document.getElementById('form');
const viewSection = document.getElementById('view');
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

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
        wishes.forEach(wish => {
            const wishCard = document.createElement('div');
            wishCard.className = 'wish-card';

            let imageHtml = '';
            if (wish.image) {
                imageHtml = `<img src="${wish.image}" alt="Presente desejado por ${wish.name}" class="wish-image">`;
            } else {
                imageHtml = `<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; font-size: 3rem;">🎁</div>`;
            }

            wishCard.innerHTML = `
                ${imageHtml}
                <div class="wish-info">
                    <div class="wish-name">${wish.name}</div>
                    <div class="wish-description">${wish.wish}</div>
                    <small style="color: #888;">Adicionado em: ${new Date(wish.date).toLocaleDateString('pt-BR')}</small>
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

// Processar envio do formulário
wishForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const wish = document.getElementById('wish').value.trim();
    const imageFile = document.getElementById('image').files[0];

    if (!name || !wish) {
        alert('Por favor, preencha seu nome e seu desejo!');
        return;
    }

    try {
        let imageBase64 = '';

        if (imageFile) {
            if (imageFile.size > 2 * 1024 * 1024) {
                alert('A imagem é muito grande! Escolha uma imagem menor que 2MB.');
                return;
            }

            imageBase64 = await fileToBase64(imageFile);
        }

        // Primeiro carrega os desejos existentes
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: {
                'X-Master-Key': MASTER_KEY
            }
        });

        const data = await response.json();
        let wishes = data.record?.wishes || [];

        // Verifica se já existe e remove se necessário
        const existingIndex = wishes.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
        if (existingIndex !== -1) {
            if (!confirm(`${name}, você já adicionou um desejo. Deseja substituí-lo?`)) {
                return;
            }
            wishes.splice(existingIndex, 1);
        }

        // Adiciona novo desejo
        wishes.push({
            name: name,
            wish: wish,
            image: imageBase64,
            date: new Date().toISOString()
        });

        // Atualiza no JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify({ wishes: wishes })
        });

        if (updateResponse.ok) {
            alert('Seu desejo foi adicionado com sucesso!');
            wishForm.reset();
            document.querySelector('[data-tab="view"]').click();
        } else {
            throw new Error('Erro ao salvar');
        }

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar desejo. Tente novamente.');
    }
});

// Converter arquivo para base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Carregar desejos ao abrir a página
document.addEventListener('DOMContentLoaded', loadWishes);