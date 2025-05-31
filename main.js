
document.addEventListener('DOMContentLoaded', () => {
    // Navegación principal (POS, Catálogo, Inventario, etc.)
    const navTabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.section');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-section');

            // Cambiar pestaña activa
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Mostrar sección correspondiente
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === target) section.classList.add('active');
            });
        });
    });

    // Navegación dentro de Crédito
    const creditTabs = document.querySelectorAll('.credit-tab');
    const creditSubsections = document.querySelectorAll('.credit-subsection');

    creditTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-credit-section');

            creditTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            creditSubsections.forEach(sub => {
                sub.classList.remove('active');
                if (sub.id === target) sub.classList.add('active');
            });
        });
    });
});
