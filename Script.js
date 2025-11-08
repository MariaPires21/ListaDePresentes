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
                    imageHtml = `<img src="${wish.image}" alt="Presente desejado por ${wish.name}" class="wish-image">`;
                } else {
                    imageHtml = `<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">Sem imagem</div>`;
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

        // Processar envio do formulário
        wishForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const wish = document.getElementById('wish').value;
            const imageFile = document.getElementById('image').files[0];

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

            // Processar imagem se for fornecida
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const newWish = {
                        name: name,
                        wish: wish,
                        image: e.target.result
                    };

                    wishes.push(newWish);
                    localStorage.setItem('familyWishes', JSON.stringify(wishes));

                    alert('Seu desejo foi adicionado com sucesso!');
                    wishForm.reset();

                    // Mudar para a aba de visualização
                    document.querySelector('[data-tab="view"]').click();
                };
                reader.readAsDataURL(imageFile);
            } else {
                const newWish = {
                    name: name,
                    wish: wish,
                    image: null
                };

                wishes.push(newWish);
                localStorage.setItem('familyWishes', JSON.stringify(wishes));

                alert('Seu desejo foi adicionado com sucesso!');
                wishForm.reset();

                // Mudar para a aba de visualização
                document.querySelector('[data-tab="view"]').click();
            }
        });

        // Carregar desejos ao abrir a página
        document.addEventListener('DOMContentLoaded', loadWishes);