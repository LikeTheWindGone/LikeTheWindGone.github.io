class AutoTOC {
    constructor(options = {}) {
        this.defaultOptions = {
            containerId: "toc",
            tocTitle: "Table of Contens",
            headerLevels: [2, 3, 4, 5, 6],
            minHeaders: 2,
            smoothScroll: true,
            scrollOffset: 20,
            showBackToTop: true,
            collapsible: false,
            useSections: true
        };
        this.options = { ...this.defaultOptions, ...options };
        this.headers = [];
        this.tocContainer = null;
        this.backToTopBtn = null;
    }

    init() {
        this.collectHeaders();
        
        if (this.headers.length < this.options.minHeaders) {
            return;
        }

        this.createContainer();
        this.generateTOC();
        
        this.addEventListeners();
        if (this.options.showBackToTop) {
            this.createBackToTopButton();
        }
    }

    collectHeaders() {
        if (this.options.useSections) {
            this.collectSectionsOnly();
            
            if (this.headers.length >= this.options.minHeaders) {
                return;
            }
            
            this.headers = [];
        }
        
        this.collectHeadersOnly();
    }

    collectSectionsOnly() {
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach((section, index) => {
            let title = this.getSectionTitle(section);
            
            if (!section.id) {
                section.id = `section-${index + 1}`;
            }
            
            const level = this.calculateSectionLevel(section);
            
            this.headers.push({
                id: section.id,
                text: title,
                level: level,
                element: section,
                type: 'section'
            });
        });
        
        this.sortHeadersByPosition();
    }

    getSectionTitle(section) {
        if (section.dataset.title) {
            return section.dataset.title.trim();
        }
        
        const firstHeader = section.querySelector('h1, h2, h3, h4, h5, h6');
        if (firstHeader) {
            return firstHeader.textContent.trim();
        }
        
        return this.formatIdAsTitle(section.id);
    }

    calculateSectionLevel(section) {
        let depth = 0;
        let currentElement = section;
        
        while (currentElement.parentElement) {
            if (currentElement.parentElement.tagName === 'SECTION') {
                depth++;
            }
            currentElement = currentElement.parentElement;
        }
        
        const level = Math.min(6, 2 + depth);
        return level;
    }

    formatIdAsTitle(id) {
        return id
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    collectHeadersOnly() {
        const selector = this.options.headerLevels.map(level => `h${level}`).join(', ');
        const allHeaders = document.querySelectorAll(selector);

        allHeaders.forEach((header, index) => {
            if (!header.id) {
                let id = header.textContent.toLowerCase()
                    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                    .replace(/^-|-$/g, '');
                if (!id || document.getElementById(id)) {
                    id = `header-${index + 1}`;
                }
                header.id = id;
            }
            this.headers.push({
                id: header.id,
                text: header.textContent.trim(),
                level: parseInt(header.tagName.charAt(1)),
                element: header,
                type: 'header'
            });
        });
    }

    sortHeadersByPosition() {
        this.headers.sort((a, b) => {
            const aPos = a.element.getBoundingClientRect().top + window.pageYOffset;
            const bPos = b.element.getBoundingClientRect().top + window.pageYOffset;
            return aPos - bPos;
        });
    }

    createContainer() {
        let container = document.getElementById(this.options.containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = this.options.containerId;

            const firstHeader = document.querySelector('h1, h2, section[id]');
            if (firstHeader) {
                firstHeader.parentNode.insertBefore(container, firstHeader.nextSibling);
            } else {
                document.body.insertBefore(container, document.body.firstChild);
            }
        }

        this.tocContainer = container;
    }

    generateTOC() {
        
        const titleElement = document.createElement('h2');
        titleElement.className = 'toc-title';
        titleElement.textContent = this.options.tocTitle;

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        // 
        let currentLevel = 0;
        let currentParent = tocList;

        this.headers.forEach((header, index) => {
            
            const listItem = document.createElement('li');
            listItem.className = `toc-item toc-level-${header.level}`;

            const link = document.createElement('a');
            link.href = `#${header.id}`;
            link.textContent = header.text;
            link.className = 'toc-link';
            link.dataset.headerId = header.id;

            listItem.appendChild(link);

            if (header.level > currentLevel) {
                const sublist = document.createElement('ul');
                sublist.className = 'toc-sublist';
                currentParent.appendChild(sublist);
                currentParent = sublist;
            } else if (header.level < currentLevel) {
                let levelDiff = currentLevel - header.level;
                while (levelDiff > 0) {
                    currentParent = currentParent.parentNode.parentNode;
                    levelDiff--;
                }
            }

            currentParent.appendChild(listItem);

            currentLevel = header.level;
        });

        this.tocContainer.innerHTML = '';

        if (this.options.collapsible) {
            const collapseIcon = document.createElement('span');
            collapseIcon.className = 'toc-collapse-icon';
            collapseIcon.innerHTML = '▼';
            collapseIcon.style.cssText = `
                margin-left: 10px;
                font-size: 0.8em;
                display: inline-block;
                transition: transform 0.3s ease;
            `;
            
            titleElement.appendChild(collapseIcon);
            
            titleElement.style.cursor = 'pointer';
            titleElement.style.position = 'relative';
            
            titleElement.addEventListener('click', () => {
                const isCollapsed = tocList.classList.contains('collapsed');
                
                if (!isCollapsed) {
                    tocList.classList.add('collapsed');
                    collapseIcon.style.transform = 'rotate(-90deg)';
                    collapseIcon.textContent = '▶';
                } else {
                    tocList.classList.remove('collapsed');
                    collapseIcon.style.transform = 'rotate(0deg)';
                    collapseIcon.textContent = '▼';
                }
            });
        }

        this.tocContainer.appendChild(titleElement);
        this.tocContainer.appendChild(tocList);
    }


    addEventListeners() {
        if (this.options.smoothScroll) {
            const links = this.tocContainer.querySelectorAll('.toc-link');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        const offsetTop = targetElement.getBoundingClientRect().top +
                            window.pageYOffset -
                            this.options.scrollOffset;

                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });

                        this.updateActiveLink(targetId);

                        history.pushState(null, null, `#${targetId}`);
                    }
                });
            });
        }

        window.addEventListener('scroll', () => {
            this.highlightCurrentSection();
        });

        setTimeout(() => this.highlightCurrentSection(), 100);
    }

    highlightCurrentSection() {
        if (!this.headers.length) return;

        let currentId = null;
        const scrollPosition = window.scrollY + this.options.scrollOffset + 100;

        for (let i = this.headers.length - 1; i >= 0; i--) {
            const header = this.headers[i];
            if (header.element.offsetTop <= scrollPosition) {
                currentId = header.id;
                break;
            }
        }

        if (!currentId && this.headers.length > 0) {
            currentId = this.headers[0].id;
        }

        this.updateActiveLink(currentId);
    }

    updateActiveLink(activeId) {
        const links = this.tocContainer.querySelectorAll('.toc-link');
        links.forEach(link => {
            if (link.dataset.headerId === activeId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    createBackToTopButton() {
        this.backToTopBtn = document.createElement('button');
        this.backToTopBtn.className = 'back-to-top';
        this.backToTopBtn.innerHTML = '↑';
        this.backToTopBtn.title = 'back-to-top';
        this.backToTopBtn.setAttribute('aria-label', 'back-to-top');

        document.body.appendChild(this.backToTopBtn);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                this.backToTopBtn.classList.add('visible');
            } else {
                this.backToTopBtn.classList.remove('visible');
            }
        });

        this.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const autoTOC = new AutoTOC({
        // containerId: 'toc',
        // tocTitle: '',
        // minHeaders: 1,
        // collapsible: true,
        // useSections: true,
        // showBackToTop: false
    });
    
    autoTOC.init();
});

window.AutoTOC = AutoTOC;