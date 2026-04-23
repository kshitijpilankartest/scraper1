/**
 * memberSelector.js — Vanilla JS Port of the 21st.dev Member Selector
 * 
 * Features:
 * - Avatar group display
 * - Dropdown with search and multiselect
 * - Lucide icon integration
 * - Filtering logic for Scarper Article Feed
 */

const MEMBERS_DATA = [
  { id: 'bensbites', name: 'Ben', role: 'Curator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben', source: 'Ben\'s Bites' },
  { id: 'rundown', name: 'Rowan', role: 'AI Expert', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rowan', source: 'The AI Rundown' },
  { id: 'reddit', name: 'Mod-Bot', role: 'Community', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reddit', source: 'Reddit' },
  { id: 'agent-z', name: 'Agent Zero', role: 'AI Analyst', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zero', source: 'Meta' },
  { id: 'karen', name: 'Karen X', role: 'Creator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karen', source: 'AI Visuals' },
];

export class MemberSelector {
  constructor(containerId, onFilterChange) {
    this.container = document.getElementById(containerId);
    this.onFilterChange = onFilterChange;
    this.selectedIds = new Set();
    this.isOpen = false;
    this.searchQuery = '';
    
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.attachGlobalEvents();
  }

  toggleDropdown(e) {
    e.stopPropagation();
    this.isOpen = !this.isOpen;
    this.render();
    if (this.isOpen) {
      setTimeout(() => this.container.querySelector('.ms-search')?.focus(), 50);
    }
  }

  closeDropdown() {
    if (this.isOpen) {
      this.isOpen = false;
      this.render();
    }
  }

  toggleMember(id) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    
    this.render();
    
    // Trigger filtering logic in parent
    const selectedSources = Array.from(this.selectedIds).map(id => {
      const m = MEMBERS_DATA.find(m => m.id === id);
      return m ? m.id : null;
    }).filter(Boolean);
    
    if (this.onFilterChange) {
      this.onFilterChange(selectedSources);
    }
  }

  handleSearch(e) {
    this.searchQuery = e.target.value.toLowerCase();
    this.renderDropdownItems();
  }

  attachGlobalEvents() {
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });
  }

  render() {
    const selectedMembers = MEMBERS_DATA.filter(m => this.selectedIds.has(m.id));
    
    this.container.innerHTML = `
      <div class="ms-wrapper">
        <div class="ms-selected-group">
          ${selectedMembers.map(m => `
            <div class="ms-avatar-wrap" title="${m.name} (${m.role})">
              <img src="${m.avatar}" alt="${m.name}" class="ms-avatar" />
            </div>
          `).join('')}
          <button class="ms-add-btn ${this.isOpen ? 'active' : ''}" aria-label="Toggle member selector">
            <i data-lucide="${this.isOpen ? 'x' : 'plus'}"></i>
          </button>
        </div>

        ${this.isOpen ? `
          <div class="ms-dropdown animate-in">
            <div class="ms-search-wrap">
              <i data-lucide="search" class="ms-search-icon"></i>
              <input type="text" class="ms-search" placeholder="Filter agents..." value="${this.searchQuery}" />
            </div>
            <div class="ms-list">
              <!-- Items rendered here dynamically for search speed -->
            </div>
            <div class="ms-footer">
               <span class="ms-count">${this.selectedIds.size} selected</span>
               <button class="ms-clear-btn" ${this.selectedIds.size === 0 ? 'disabled' : ''}>Clear</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Process Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Attach local events
    const addBtn = this.container.querySelector('.ms-add-btn');
    addBtn?.addEventListener('click', (e) => this.toggleDropdown(e));

    const searchInput = this.container.querySelector('.ms-search');
    searchInput?.addEventListener('input', (e) => this.handleSearch(e));

    const clearBtn = this.container.querySelector('.ms-clear-btn');
    clearBtn?.addEventListener('click', () => {
      this.selectedIds.clear();
      this.render();
      if (this.onFilterChange) this.onFilterChange([]);
    });

    if (this.isOpen) {
      this.renderDropdownItems();
    }
  }

  renderDropdownItems() {
    const list = this.container.querySelector('.ms-list');
    if (!list) return;

    const filtered = MEMBERS_DATA.filter(m => 
      m.name.toLowerCase().includes(this.searchQuery) ||
      m.role.toLowerCase().includes(this.searchQuery)
    );

    list.innerHTML = filtered.map(m => `
      <div class="ms-item ${this.selectedIds.has(m.id) ? 'selected' : ''}" data-id="${m.id}">
        <img src="${m.avatar}" class="ms-item-avatar" />
        <div class="ms-item-info">
          <div class="ms-item-name">${m.name}</div>
          <div class="ms-item-role">${m.role}</div>
        </div>
        <div class="ms-item-check">
          ${this.selectedIds.has(m.id) ? '<i data-lucide="check"></i>' : ''}
        </div>
      </div>
    `).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }

    list.querySelectorAll('.ms-item').forEach(item => {
      item.addEventListener('click', () => this.toggleMember(item.dataset.id));
    });
  }
}
