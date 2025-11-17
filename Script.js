// Elementos da interface
const tabBtns = document.querySelectorAll('.tab-btn');
const formSection = document.getElementById('form');
const viewSection = document.getElementById('view');
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

// Alternar entre abas
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remover classe active de todas as abas
        tabBtns.forEach(b => b.classList.remove('active'));
        // Adicionar classe active à aba clicada
        btn.classList.add('active');

        // Mostrar a seção correspondente
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

// Carregar desejos do localStorage
function loadWishes() {
    const wishes = JSON.parse(localStorage.getItem('familyWishes')) || [];

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
            imageHtml = `<img src="${wish.image}" alt="Presente desejado por ${wish.name}" class="wish-image" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;\\'>❌ Erro na imagem</div>'">`;
        } else {
            imageHtml = `<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">🎁<br><small>Sem imagem</small></div>`;
        }

        wishCard.innerHTML = `
            ${imageHtml}
            <div class="wish-info">
                <div class="wish-name">${wish.name}</div>
                <div class="wish-description">${wish.wish}</div>
            </div>
        `;

        wishList.appendChild(wishCard);
    });
}

// FUNÇÃO MELHORADA para comprimir imagens
function compressImage(file) {
    return new Promise((resolve, reject) => {
        // Verificar tamanho primeiro
        if (file.size > 10 * 1024 * 1024) { // 10MB
            alert('❌ Esta imagem é muito grande! Escolha uma imagem menor que 10MB.');
            reject(new Error('Imagem muito grande'));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Tamanho máximo reduzido
                const MAX_SIZE = 400;
                let width = img.width;
                let height = img.height;

                // Redimensionar mantendo proporção
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Comprimir imagem
                ctx.drawImage(img, 0, 0, width, height);

                // Qualidade reduzida para arquivo menor
                try {
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    console.log('✅ Imagem comprimida com sucesso');
                    resolve(compressedBase64);
                } catch (error) {
                    console.error('❌ Erro na compressão:', error);
                    // Fallback: usar imagem original
                    resolve(e.target.result);
                }
            };

            img.onerror = function () {
                console.error('❌ Erro ao carregar imagem');
                alert('❌ Erro ao processar a imagem. Tente outra imagem.');
                reject(new Error('Erro ao carregar imagem'));
            };

            img.src = e.target.result;
        };

        reader.onerror = function (error) {
            console.error('❌ Erro ao ler arquivo:', error);
            alert('❌ Não foi possível ler a imagem. Tente outro arquivo.');
            reject(error);
        };

        reader.readAsDataURL(file);
    });
}

// Processar envio do formulário - VERSÃO CORRIGIDA
wishForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const wish = document.getElementById('wish').value.trim();
    const imageFile = document.getElementById('image').files[0];

    // Validação básica
    if (!name || !wish) {
        alert('Por favor, preencha seu nome e seu desejo!');
        return;
    }

    // Verificar se já existe um desejo com este nome
    const wishes = JSON.parse(localStorage.getItem('familyWishes')) || [];
    const existingIndex = wishes.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

    if (existingIndex !== -1) {
        if (confirm(`${name}, você já adicionou um desejo. Deseja substituí-lo?`)) {
            wishes.splice(existingIndex, 1);
        } else {
            return;
        }
    }

    try {
        let imageBase64 = null;

        // Processar imagem se for fornecida
        if (imageFile) {
            console.log('🖼️ Processando imagem...');

            // Mostrar feedback para o usuário
            const submitButton = wishForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '⏳ Comprimindo imagem...';
            submitButton.disabled = true;

            try {
                imageBase64 = await compressImage(imageFile);
                console.log('✅ Imagem processada com sucesso');
            } catch (error) {
                console.error('❌ Erro no processamento da imagem:', error);
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                return; // Para aqui se deu erro na imagem
            }

            // Restaurar botão
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }

        // Criar novo desejo
        const newWish = {
            name: name,
            wish: wish,
            image: imageBase64
        };

        wishes.push(newWish);
        localStorage.setItem('familyWishes', JSON.stringify(wishes));

        alert('🎄 Seu desejo foi adicionado com sucesso!' + (imageBase64 ? ' (Com imagem)' : ''));
        wishForm.reset();

        // Mudar para a aba de visualização
        document.querySelector('[data-tab="view"]').click();

    } catch (error) {
        console.error('❌ Erro geral:', error);
        alert('❌ Erro ao adicionar desejo. Tente novamente.');
    }
});

// Carregar desejos ao abrir a página
document.addEventListener('DOMContentLoaded', loadWishes);