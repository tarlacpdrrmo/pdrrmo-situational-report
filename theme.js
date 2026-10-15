(() => {
    const page = location.pathname.split('/').pop() || '';
    const selectors = {
        'admin.html': '.top-header,.admin-card',
        'data_entry.html': '.top-header,#mainContextPanel,#workspaceToolbar,.workspace-tabs-container',
        'trend_analysis.html': '.intro,.sec-h,.panel',
        'archives.html': '.top-header,.filter-panel,.instruction-state,#tables-wrapper>.panel',
        'inventory.html': '.top-header,.ledger-grid>.panel,.ledger-grid+.panel'
    };
    const selector = selectors[page];
    if (!selector || !('IntersectionObserver' in window)) {
        if (selector) document.querySelectorAll(selector).forEach(node => node.classList.add('is-revealed'));
        return;
    }

    let observer;
    const observed = new WeakSet();
    const observeTargets = () => {
        if (getComputedStyle(document.body).visibility === 'hidden') return false;
        observer ||= new IntersectionObserver(entries => {
            entries.forEach(entry => entry.target.classList.toggle('is-revealed', entry.isIntersecting));
        }, { threshold: 0, rootMargin: '0px' });

        document.querySelectorAll(selector).forEach((node, index) => {
            if (observed.has(node)) return;
            observed.add(node);
            node.classList.add('scroll-reveal');
            node.style.setProperty('--reveal-delay', `${Math.min((index % 6) * 75, 375)}ms`);
            observer.observe(node);
        });
        return true;
    };

    if (!observeTargets()) {
        const visibilityObserver = new MutationObserver(() => {
            if (observeTargets()) visibilityObserver.disconnect();
        });
        visibilityObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    }

    if (page === 'archives.html') {
        const contentObserver = new MutationObserver(observeTargets);
        const tables = document.getElementById('tables-wrapper');
        if (tables) contentObserver.observe(tables, { attributes: true, attributeFilter: ['style'] });
    }
})();
