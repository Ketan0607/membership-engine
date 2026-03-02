/**
 * Simple utility to fetch JSON from our API and handle errors gracefully
 */
async function apiFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (!response.ok) {
                // Legitimate error from server (like 401) - don't hit mock!
                const err = new Error(data.message || 'Request failed');
                err.status = response.status;
                throw err;
            }
            return data;
        } else {
            // Not JSON - might be a 404 or backend issue
            throw new Error('Invalid response format');
        }
    } catch (error) {
        // Only use mock if it's a network error OR we explicitly want sandbox
        if (error.status === 401 || error.status === 400 || error.status === 403) {
            throw error; // Rethrow auth/validation errors
        }
        console.warn("Backend connectivity issue. Using Local Demo Sandbox Mode for:", url);
        return mockOfflineAPI(url, options);
    }
}

// MOCK DATA FOR LOCAL TESTING WITHOUT NODE.JS
function mockOfflineAPI(url, options) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (url.includes('/api/auth/register')) {
                // Mock Register
                localStorage.setItem('mock_user', JSON.stringify({ id: 1, fullName: "Demo User", email: "demo@site.com", role: "member" }));
                resolve({ success: true, message: "Registration successful. You can log in now." });
            }
            else if (url.includes('/api/auth/login')) {
                // Mock Login
                const userObj = { id: 1, fullName: "Demo Sandbox User", email: "demo@site.com", role: "member" };
                localStorage.setItem('mock_user', JSON.stringify(userObj));
                resolve({ success: true, message: "Logged in successfully", user: userObj });
            }
            else if (url.includes('/api/auth/logout')) {
                // Mock Logout
                localStorage.removeItem('mock_user');
                localStorage.removeItem('mock_sub');
                resolve({ success: true, message: "Logged out successfully" });
            }
            else if (url.includes('/api/auth/me')) {
                // Mock Auth State
                const userStr = localStorage.getItem('mock_user');
                if (userStr && userStr !== 'true') {
                    // Try to parse the object we saved
                    try {
                        resolve({ user: JSON.parse(userStr) });
                    } catch (e) {
                        resolve({ user: { id: 1, fullName: "Demo User", email: "demo@site.com", role: "member" } });
                    }
                } else if (userStr === 'true') {
                    // Legacy fallback if they had 'true' saved from before
                    resolve({ user: { id: 1, fullName: "Legacy User", email: "demo@site.com", role: "member" } });
                } else {
                    resolve({ user: null });
                }
            }
            else if (url.includes('/api/plans')) {
                // Mock Plans List
                resolve([
                    { id: 1, name: 'Basic', price: 4.99, duration_days: 30, tier_level: 1, description: 'Access to basic content' },
                    { id: 2, name: 'Pro', price: 9.99, duration_days: 30, tier_level: 2, description: 'Access to pro content' },
                    { id: 3, name: 'Premium', price: 19.99, duration_days: 30, tier_level: 3, description: 'Access to all content' }
                ]);
            }
            else if (url.includes('/api/subscriptions/subscribe/')) {
                // Mock Subscribe Action
                const planId = parseInt(url.split('/').pop());
                const tier = planId === 1 ? 1 : planId === 2 ? 2 : 3;
                const name = planId === 1 ? 'Basic' : planId === 2 ? 'Pro' : 'Premium';

                const start = new Date();
                const end = new Date();
                end.setDate(end.getDate() + 30);

                const sub = {
                    status: 'active',
                    name: name,
                    tier_level: tier,
                    start_date: start.toISOString(),
                    end_date: end.toISOString()
                };
                localStorage.setItem('mock_sub', JSON.stringify(sub));

                resolve({ success: true, message: `Subscribed to ${name} successfully!` });
            }
            else if (url.includes('/api/subscriptions/my')) {
                // Mock Current Subscription
                const subStr = localStorage.getItem('mock_sub');
                if (subStr) {
                    resolve(JSON.parse(subStr));
                } else {
                    resolve(null);
                }
            }
            else if (url.includes('/api/content')) {
                // Mock Content Endpoint
                const subStr = localStorage.getItem('mock_sub');
                const userTier = subStr ? JSON.parse(subStr).tier_level : 0;

                const allContent = [
                    { id: 1, title: 'Basic Course', description: 'Introductory material about our platform.', required_tier: 1 },
                    { id: 2, title: 'Intermediate Tutorials', description: 'Deeper dive into topics.', required_tier: 1 },
                    { id: 3, title: 'Pro Course', description: 'Advanced lessons and techniques.', required_tier: 2 },
                    { id: 4, title: '1-on-1 Mentoring VODs', description: 'Recorded mentoring sessions.', required_tier: 2 },
                    { id: 5, title: 'Premium Masterclass', description: 'Exclusive content and secret strategies.', required_tier: 3 },
                    { id: 6, title: 'Live Event Archives', description: 'Access to all past live webinar recordings.', required_tier: 3 }
                ];

                resolve(allContent.map(c => ({
                    ...c,
                    hasAccess: userTier >= c.required_tier
                })));
            }
            else if (url.includes('/api/auth/profile')) {
                // Mock Profile Update
                const { fullName } = JSON.parse(options.body);
                const userStr = localStorage.getItem('mock_user');
                let userObj = userStr ? JSON.parse(userStr) : { id: 1, email: "demo@site.com", role: "member" };
                userObj.fullName = fullName;
                localStorage.setItem('mock_user', JSON.stringify(userObj));
                resolve({ success: true, message: "Profile updated successfully", user: userObj });
            }
            else if (url.includes('/api/subscriptions/history')) {
                // Mock History
                const subStr = localStorage.getItem('mock_sub');
                if (subStr) {
                    const sub = JSON.parse(subStr);
                    resolve([{ ...sub, price: sub.tier_level === 3 ? 19.99 : (sub.tier_level === 2 ? 9.99 : 4.99) }]);
                } else {
                    resolve([]);
                }
            }
            else {
                reject(new Error("Unknown Mock Route"));
            }
        }, 500); // 500ms fake delay
    });
}

/**
 * Utility to format dates nicely 
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
