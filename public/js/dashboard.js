document.addEventListener('DOMContentLoaded', async () => {

    // Elements
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    const adminBadge = document.getElementById('adminBadge');

    const activePlanName = document.getElementById('activePlanName');
    const activePlanExpiry = document.getElementById('activePlanExpiry');

    const contentGrid = document.getElementById('contentGrid');
    const upgradeGrid = document.getElementById('upgradeGrid');
    const historyTableBody = document.getElementById('historyTableBody');

    const contentAlert = document.getElementById('contentAlert');
    const upgradeAlert = document.getElementById('upgradeAlert');
    const historyAlert = document.getElementById('historyAlert');
    const settingsAlert = document.getElementById('settingsAlert');

    const settingsForm = document.getElementById('settingsForm');
    const settingsFullName = document.getElementById('settingsFullName');
    const settingsEmail = document.getElementById('settingsEmail');

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
        updateUserUI(user);

    } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = 'register.html';
        return;
    }

    function updateUserUI(userData) {
        userNameEl.textContent = userData.fullName;
        userEmailEl.textContent = userData.email;
        userAvatarEl.textContent = userData.fullName.charAt(0).toUpperCase();

        settingsFullName.value = userData.fullName;
        settingsEmail.value = userData.email;

        if (userData.role === 'admin') {
            adminBadge.classList.remove('hidden');
        }
    }

    // 2. Load Subscription
    async function loadSubscription() {
        try {
            const sub = await apiFetch('/api/subscriptions/my');
            if (sub && sub.status === 'active') {
                activePlanName.textContent = sub.name;
                activePlanExpiry.innerHTML = `
                    <div style="margin-top:0.5rem; font-size:0.9rem;">
                        Status: <strong style="color:var(--secondary)">Active</strong><br>
                        Tier Level: <strong>${sub.tier_level}</strong><hr style="border-color:var(--border);margin:12px 0;opacity:0.3;">
                        Started: <strong>${formatDate(sub.start_date)}</strong><br>
                        Ends on:  <strong>${formatDate(sub.end_date)}</strong>
                    </div>
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

            upgradeGrid.innerHTML = plans.map(p => `
                <div class="pricing-card">
                    <h3>${p.name} <span class="tier-badge" style="float:right;">Tier ${p.tier_level}</span></h3>
                    <div class="price"><span>$</span>${p.price}<span class="duration">/${p.duration_days}d</span></div>
                    <p>${p.description}</p>
                    <button class="btn btn-primary" onclick="subscribeToPlan(${p.id})">Subscribe Now</button>
                </div>
            `).join('');

        } catch (error) {
            console.error("Error loading plans", error);
            upgradeAlert.className = "alert error";
            upgradeAlert.textContent = "Failed to load subscription plans.";
        }
    }

    // 5. Load History
    async function loadHistory() {
        try {
            const history = await apiFetch('/api/subscriptions/history');
            if (!history || history.length === 0) {
                historyTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-muted);">No subscription history found.</td></tr>`;
                return;
            }

            historyTableBody.innerHTML = history.map(h => `
                <tr style="border-bottom: 1px solid var(--border); opacity: ${h.status !== 'active' ? '0.7' : '1'}">
                    <td style="padding: 1rem 0;">
                        <strong>${h.name}</strong><br>
                        <small class="text-muted">Tier ${h.tier_level}</small>
                    </td>
                    <td style="padding: 1rem 0;">$${h.price}</td>
                    <td style="padding: 1rem 0;">${formatDate(h.start_date)}</td>
                    <td style="padding: 1rem 0;">
                        <span class="tier-badge" style="background: ${h.status === 'active' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}; color: white;">
                            ${h.status.toUpperCase()}
                        </span>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error("Error loading history", error);
            historyAlert.className = 'alert error';
            historyAlert.textContent = "Failed to load billing history.";
        }
    }

    // 6. Settings Form
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            settingsAlert.className = 'alert';
            settingsAlert.textContent = '';

            const res = await apiFetch('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ fullName: settingsFullName.value })
            });

            settingsAlert.className = 'alert success';
            settingsAlert.textContent = res.message;

            // Update UI
            user.fullName = settingsFullName.value;
            updateUserUI(user);

        } catch (error) {
            settingsAlert.className = 'alert error';
            settingsAlert.textContent = error.message;
        }
    });

    // Run Initialization
    await Promise.all([
        loadSubscription(),
        loadContent(),
        loadPlans(),
        loadHistory()
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
        if (!confirm("Confirm purchase? This will simulate a payment process.")) return;

        try {
            upgradeAlert.className = 'alert';
            upgradeAlert.textContent = '';

            const res = await apiFetch(`/api/subscriptions/subscribe/${planId}`, {
                method: 'POST'
            });

            upgradeAlert.className = 'alert success';
            upgradeAlert.textContent = res.message;

            // Re-fetch everything
            await Promise.all([
                loadSubscription(),
                loadContent(),
                loadHistory()
            ]);

            setTimeout(() => {
                switchTab('content');
                upgradeAlert.className = 'alert';
            }, 2000);

        } catch (error) {
            upgradeAlert.className = 'alert error';
            upgradeAlert.textContent = error.message;
        }
    };

    // Global Tab Switch Function
    window.switchTab = function (tabName) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));

        const targetTab = document.getElementById(`tab-${tabName}`);
        const navLink = document.getElementById(`nav-${tabName}`);

        if (targetTab) targetTab.classList.add('active');
        if (navLink) navLink.classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

});
