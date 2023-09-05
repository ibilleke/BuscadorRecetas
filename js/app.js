function iniciarApp() {
    
    const selectCategorias = document.querySelector('#categorias');
    const resultado = document.querySelector('#resultado');
    
    if(selectCategorias) {
        selectCategorias.addEventListener('change', seleccionarCategoria);

        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');
    if(favoritosDiv) {
        obtenerFavoritos();
    }
    
    const modal = new bootstrap.Modal('#modal', {})

    function obtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php'
        fetch(url)
            .then( respuesta => respuesta.json())
            .then( resultado => mostrarCategorias( resultado.categories ))
    }

    function mostrarCategorias( categorias = [] ) {
        categorias.forEach( categoria => {
            const { strCategory } = categoria;
            const option = document.createElement('OPTION');
            option.value = strCategory;
            option.textContent = strCategory;
            
            selectCategorias.appendChild(option);
        })
    }

    function seleccionarCategoria(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
        fetch(url)
            .then( respuesta => respuesta.json())
            .then( resultado => mostrarRecetas( resultado.meals ))

        }
        
    function mostrarRecetas( recetas = []) { 
        
        limpiarHTML(resultado);

        const heading = document.createElement('h2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados': 'No hay resultados';
        resultado.appendChild(heading);

        // Iterar en los resultados
        recetas.forEach( receta => {
            const { idMeal, strMeal, strMealThumb } = receta;
            
            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');
            
            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');
            
            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;
            
            const recetaCarBody = document.createElement('DIV');
            recetaCarBody.classList.add('card-body');
            
            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-tittle', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';
            // recetaButton.dataset.bsTarget = "#modal";
            // recetaButton.dataset.bsToggle = "modal";
            recetaButton.onclick = function() {
                seleccionarReceta(idMeal ?? receta.id);
            }
            
            // Inyectar en el codigo HTML
            recetaCarBody.appendChild(recetaHeading);
            recetaCarBody.appendChild(recetaButton);
            
            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCarBody);
                
            recetaContenedor.appendChild(recetaCard);
                
            resultado.appendChild(recetaContenedor);
        })
    }

    function seleccionarReceta(id) {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then( respuesta => respuesta.json() )
            .then( resultado => mostrarRecetaModal(resultado.meals[0]) )
    }

    function mostrarRecetaModal(receta) {

        const { idMeal, strInstructions, strMeal, strMealThumb } = receta;;
        
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}" />
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y cantidades </h3>
        `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');

        // Mostrar casntidades e ingredientes
        for(let i = 1; i <= 20; i++) {
            if(receta[`strIngredient${i}`]) {
                const ingredientes = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredientesLi = document.createElement('LI');
                ingredientesLi.classList.add('list-group-item');
                ingredientesLi.textContent = `${ingredientes} - ${cantidad}`;

                listGroup.appendChild(ingredientesLi);
            }
        }

        modalBody.appendChild(listGroup);

        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);

        // Botones de cerrar y favorito
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';

        //LocalStorage
        btnFavorito.onclick = function () {

            if (existeStorage(idMeal)) {
                eliminarFavoritos(idMeal);
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado Correctamente');
                return
            }

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb
            });
            btnFavorito.textContent = 'Eliminar Favorito';
            mostrarToast('Agregado Correctamente');
        }

        const btnCerrar = document.createElement('BUTTON');
        btnCerrar.classList.add('btn', 'btn-secondary', 'col');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.onclick = function () {
            modal.hide();
        }

        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrar);

        // Muestra el modal para
        modal.show();
    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));

        if (favoritosDiv) { 
            
            const nuevosFavoritos = JSON.parse(localStorage.getItem('favoritos'));
            
            // limpiarHTML(resultado);
            mostrarRecetas(nuevosFavoritos);
 
        }
    }

    function eliminarFavoritos(id) {

        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);

        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));

        if (favoritosDiv) { 
            
            // limpiarHTML(resultado);
            mostrarRecetas(nuevosFavoritos);
 
        }

    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id)
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;
        toast.show();
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        if(favoritos.length) {
            mostrarRecetas(favoritos);
            return
        }

        const noFavoritos = document.createElement('P');
        noFavoritos.textContent = 'No hay favoritos aún';
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        favoritosDiv.appendChild(noFavoritos);
    }

    function limpiarHTML(selector) {
        while(selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);

