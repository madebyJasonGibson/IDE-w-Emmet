/* --- Mobile Sidebar Toggle --- */

const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('fileTreeSidebar');
const overlay = document.getElementById('sidebarOverlay');

/* @tweakable breakpoint for mobile layout (px) */
const mobileBreakpoint = 768; // Corresponds to 'md' in Tailwind by default

export function isMobileView() {
    return window.innerWidth < mobileBreakpoint;
}

export function showSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('sidebar-hidden');
    sidebar.classList.add('sidebar-visible');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

export function hideSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('sidebar-visible');
    sidebar.classList.add('sidebar-hidden');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
}

export function initMobileSidebar() {
    if (!sidebarToggle || !sidebar || !overlay) {
        console.error("Mobile sidebar elements not found.");
        return;
    }

    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('sidebar-hidden')) {
            showSidebar();
        } else {
            hideSidebar();
        }
    });

    overlay.addEventListener('click', () => {
        hideSidebar();
    });

    window.addEventListener('resize', () => {
        if (!isMobileView() && sidebar.classList.contains('sidebar-visible')) {
            hideSidebar();
            sidebar.classList.remove('sidebar-hidden', 'sidebar-visible');
            sidebar.style.transform = '';
        } else if (isMobileView() && sidebar.classList.contains('sidebar-visible')) {
            sidebar.classList.add('sidebar-visible');
            sidebar.classList.remove('sidebar-hidden');
        } else if (!isMobileView() && !sidebar.classList.contains('sidebar-visible') && !sidebar.classList.contains('sidebar-hidden')) {
            showSidebar();
            sidebar.classList.remove('sidebar-hidden', 'sidebar-visible', 'transition-transform', 'duration-300', 'ease-in-out');
            sidebar.style.transform = '';
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    setTimeout(() => {
        if (isMobileView()) {
            hideSidebar();
            sidebar.classList.add('transition-transform', 'duration-300', 'ease-in-out');
        } else {
            showSidebar();
            sidebar.classList.remove('sidebar-hidden', 'sidebar-visible', 'transition-transform', 'duration-300', 'ease-in-out');
            sidebar.style.transform = '';
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }, 0);
}
