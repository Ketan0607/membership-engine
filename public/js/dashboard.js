document.addEventListener('DOMContentLoaded', async () => {

    // Elements
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const adminBadge = document.getElementById('adminBadge');

    const activePlanName = document.getElementById('activePlanName');
    const activePlanExpiry = document.getElementById('activePlanExpiry');

    const contentGrid = document.getElementById('contentGrid');
    const upgradeGrid = document.getElementById('upgradeGrid');

    const contentAlert = document.getElementById('contentAlert');
    const upgradeAlert = document.getElementById('upgradeAlert');

    const logoutBtn = document.getElementById('logoutBtn');

    // 1. Verify Auth
    let user = null;
    try {
        const authData = await apiFetch('/api/auth/me');
        if (!authData.user) {
            window.location.href = 'register.html';
            return;
        }
        user = authData.user;
        userNameEl.textContent = user.fullName;
        userEmailEl.textContent = user.email;

        if (user.role === 'admin') {
            adminBadge.classList.remove('hidden');
        }

    } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = 'register.html';
        return;
    }

    // 2. Load Subscription
    async function loadSubscription() {
        try {
            const sub = await apiFetch('/api/subscriptions/my');
            if (sub && sub.status === 'active') {
                activePlanName.textContent = sub.name;
                activePlanExpiry.innerHTML = `
                    Status: <strong style="color:var(--secondary)">Active</strong><br>
                    Tier Level: <strong>${sub.tier_level}</strong><hr style="border-color:var(--border);margin:8px 0;">
                    Started: <strong>${formatDate(sub.start_date)}</strong><br>
                    Ends on:  <strong>${formatDate(sub.end_date)}</strong>
                `;
            } else {
                activePlanName.textContent = "Free / Inactive";
                activePlanExpiry.textContent = "You do not have a paid subscription right now.";
            }
        } catch (error) {
            console.error("Error loading subscription", error);
        }
    }

    // 3. Load Content
    async function loadContent() {
        try {
            const contentList = await apiFetch('/api/content');

            if (!contentList || contentList.length === 0) {
                contentGrid.innerHTML = `<p>No content available.</p>`;
                return;
            }

            contentGrid.innerHTML = contentList.map(c => {
                const isLocked = !c.hasAccess;
                const icon = c.required_tier === 3 ? '👑' : (c.required_tier === 2 ? '🚀' : '📘');

                return `
                    <div class="content-card ${isLocked ? 'locked' : ''}">
                        <div class="thumb">
                            ${icon}
                            ${isLocked ? `
                                <div class="lock-overlay">
                                    <span>🔒</span>
                                    <div class="upgrade-badge">Requires Tier ${c.required_tier}</div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="body">
                            <span class="tier-badge">Tier ${c.required_tier} Content</span>
                            <h3>${c.title}</h3>
                            <p>${c.description}</p>
                            ${!isLocked ? `<button class="btn btn-outline" style="width:100%">Access Materials</button>` : `<button class="btn btn-primary" style="width:100%" onclick="switchTab('upgrade')">Upgrade to Unlock</button>`}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error("Error loading content", error);
            contentAlert.className = "alert error";
            contentAlert.textContent = "Failed to load content library.";
        }
    }

    // 4. Load Upgrade Plans
    async function loadPlans() {
        try {
            const plans = await apiFetch('/api/plans');

            if (!plans || plans.length === 0) {
                upgradeGrid.innerHTML = `<p>No plans available.</p>`;
                return;
            }

            // We could compare with the current plan level to only show UPGRADES, 
            // but for simplicity, we show all plans and let them switch/renew.
            upgradeGrid.innerHTML = plans.map(p => `
                <div class="pricing-card" style="padding: 2rem;">
                    <h3>${p.name} <span class="tier-badge" style="float:right;">Tier ${p.tier_level}</span></h3>
                    <div class="price"><span>$</span>${p.price}<span class="duration">/${p.duration_days}d</span></div>
                    <p style="font-size:0.9rem">${p.description}</p>
                    <button class="btn btn-primary" onclick="subscribeToPlan(${p.id})">Subscribe & Unlock</button>
                </div>
            `).join('');

        } catch (error) {
            console.error("Error loading plans", error);
            upgradeAlert.className = "alert error";
            upgradeAlert.textContent = "Failed to load subscription plans.";
        }
    }

    // Run Initialization
    await Promise.all([
        loadSubscription(),
        loadContent(),
        loadPlans()
    ]);

    // Handle Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await apiFetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Logout failed", error);
        }
    });

    // Make functions globally available for inline onclicks
    window.subscribeToPlan = async function (planId) {
        if (!confirm("Are you sure you want to purchase this plan? (Simulated)")) return;

        try {
            upgradeAlert.className = 'alert';
            upgradeAlert.textContent = '';

            const res = await apiFetch(`/api/subscriptions/subscribe/${planId}`, {
                method: 'POST'
            });

            upgradeAlert.className = 'alert success';
            upgradeAlert.textContent = res.message;

            // Re-fetch everything to update UI immediately
            await loadSubscription();
            await loadContent();

            // Switch back to content tab gently after 2s
            setTimeout(() => {
                switchTab('content');
                upgradeAlert.className = 'alert'; // hide
            }, 2000);

        } catch (error) {
            upgradeAlert.className = 'alert error';
            upgradeAlert.textContent = error.message;
        }
    };

});

// Global Tab Switch Function
window.switchTab = function (tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Un-highlight all nav links
    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));

    // Show selected
    const targetTab = document.getElementById(`tab-${tabName}`);
    const navLink = document.getElementById(`nav-${tabName}`);

    if (targetTab) targetTab.classList.add('active');
    if (navLink) navLink.classList.add('active');

    // Scroll top in mobile views
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
