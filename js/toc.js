class AutoTOC {
    constructor(options = {}) {
        this.defaultOptions = {
            containerId: "toc",
            tocTitle: "Table of Contents",
            headerLevels: [2, 3, 4, 5, 6],
            minHeaders: 2,
            smoothScroll: true,
            scrollOffset: 20,
            showBackToTop: true,
            collapsible: false
        };
        this.options = { ...this.defaultOptions, ...options };
        this.headers = [];
        this.tocContainer = null;
        this.backToTopBtn = null;
    }

    init() {
        this.collectHeaders();
        if (this.headers.length < this.options.minHeaders) {
            console.log(`标题数量不足 ${this.options.minHeaders} 个，不生成目录`);
            return;
        }

        this.createContainer();
        this.generateTOC();

        // this.addStyles();

        this.addEventListeners();
        if (this.options.showBackToTop) {
            this.createBackToTopButton();
        }
    }

    collectHeaders() {
        const selector = this.options.headerLevels.map(level => `h${level}`).join(', ');
        const allHeaders = document.querySelectorAll(selector);

        allHeaders.forEach(
            (header, index) => {
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
                    element: header
                });
            }
        );
    }

    createContainer() {
        let container = document.getElementById(this.options.containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = this.options.containerId;

            const firstHeader = document.querySelector('h1, h2');
            if (firstHeader) {
                firstHeader.parentNode.insertBefore(container, firstHeader.nextSibling);
            } else {
                document.body.insertBefore(container, document.body.firstChild);
            }
        }

        this.tocContainer = container;
    }

    /*generateTOC() {
        this.tocContainer.innerHTML = '';

        const titleElement = document.createElement('h2');
        titleElement.className = 'toc-title';
        titleElement.textContent = this.options.tocTitle;

        if (this.options.collapsible) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toc-toggle';
            toggleBtn.textContent = '折叠';
            this.tocContainer.appendChild(toggleBtn);
        }

        let tocHTML = '';
        let currentLevel = 2;

        this.headers.forEach((header, index) => {
            if (header.level > currentLevel) {
                tocHTML += '<ul class="toc-sublist">';
            } else if (header.level < currentLevel) {
                const diff = currentLevel - header.level;
                for (let i = 0; i < diff; i++) {
                    tocHTML += '</li></ul>';
                }
            } else if (index > 0) {
                tocHTML += '</li>';
            }

            tocHTML += `
                <li class="toc-item toc-level-${header.level}">
                <a href="#${header.id}" class="toc-link" data-header-id="${header.id}">
                    ${header.Text}
                </a>`;

            currentLevel = header.level;
        });

        for (let i = currentLevel; i > 2; i--) {
            tocHTML += '</li></ul>';
        }
        if (this.headers.length > 0) {
            tocHTML += '</li>';
        }

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';
        tocList.innerHTML = tocHTML;

        if (this.options.collapsible) {
            const toggleBtn = this.tocContainer.querySelector('.toc-toggle');
            toggleBtn.addEventListener('click', () => {
                tocList.classList.toggle('collapsed');
                toggleBtn.textContent = tocList.classList.contains('collapsed') ? '展开' : '折叠';
            });
        }

        const countBadge = document.createElement('span');
        countBadge.className = 'toc-count';
        countBadge.textContent = `(${this.headers.length}个章节)`;
        titleElement.appendChild(countBadge);

        this.tocContainer.appendChild(titleElement);
        this.tocContainer.appendChild(tocList);
    }*/

    generateTOC() {
        const titleElement = document.createElement('h2');
        titleElement.className = 'toc-title';
        titleElement.textContent = this.options.tocTitle;

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

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
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toc-toggle';
            toggleBtn.textContent = '折叠';
            toggleBtn.addEventListener('click', () => {
                tocList.classList.toggle('collapsed');
                toggleBtn.textContent = tocList.classList.contains('collapsed') ? '展开' : '折叠';
            });
            this.tocContainer.appendChild(toggleBtn);
        }

        this.tocContainer.appendChild(titleElement);
        this.tocContainer.appendChild(tocList);
    }

    addEventListeners() {
        if (this.options.smoothScroll) {
            // 平滑滚动
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

                        // 更新活动链接
                        this.updateActiveLink(targetId);

                        // 更新URL hash（但不触发滚动）
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

    // 高亮当前章节
    highlightCurrentSection() {
        if (!this.headers.length) return;

        let currentId = null;
        const scrollPosition = window.scrollY + this.options.scrollOffset + 100;

        // 找到当前可见的标题
        for (let i = this.headers.length - 1; i >= 0; i--) {
            const header = this.headers[i];
            if (header.element.offsetTop <= scrollPosition) {
                currentId = header.id;
                break;
            }
        }

        // 如果没有找到，使用第一个标题
        if (!currentId && this.headers.length > 0) {
            currentId = this.headers[0].id;
        }

        this.updateActiveLink(currentId);
    }

    // 更新活动链接
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
        this.backToTopBtn.title = '返回顶部';
        this.backToTopBtn.setAttribute('aria-label', '返回顶部');

        document.body.appendChild(this.backToTopBtn);

        // 显示/隐藏按钮
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                this.backToTopBtn.classList.add('visible');
            } else {
                this.backToTopBtn.classList.remove('visible');
            }
        });

        // 点击返回顶部
        this.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

}