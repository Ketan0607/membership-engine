document.addEventListener('DOMContentLoaded', () => {

    // UI Logic to swap forms
    const registerCard = document.getElementById('registerCard');
    const loginCard = document.getElementById('loginCard');
    const showLogin = document.getElementById('showLogin');
    const showRegister = document.getElementById('showRegister');

    // Form Submissions
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    // Alerts
    const registerAlert = document.getElementById('registerAlert');
    const loginAlert = document.getElementById('loginAlert');

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        hideAlert(registerAlert);
    });

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.classList.add('hidden');
        registerCard.classList.remove('hidden');
        hideAlert(loginAlert);
    });

    // Handle Registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('regBtn');
        btn.disabled = true;
        btn.innerText = "Registering...";

        const fullName = document.getElementById('regFullName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        try {
            const data = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ fullName, email, password })
            });

            showAlert(registerAlert, data.message, 'success');
            registerForm.reset();
            // Optional: Auto switch to login
            setTimeout(() => {
                showLogin.click();
                showAlert(loginAlert, "Registration successful. Please log in.", "success");
            }, 1500);
        } catch (error) {
            showAlert(registerAlert, error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = "Register Now";
        }
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginSubmitBtn');
        btn.disabled = true;
        btn.innerText = "Logging in...";

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            // Redirect to dashboard on success
            window.location.href = "dashboard.html";
        } catch (error) {
            showAlert(loginAlert, error.message, 'error');
            btn.disabled = false;
            btn.innerText = "Log In";
        }
    });

    // Helpers
    function showAlert(element, message, type) {
        element.textContent = message;
        element.className = `alert ${type}`; // resets class and adds error/success to display block
    }

    function hideAlert(element) {
        element.className = 'alert'; // hides it back
        element.textContent = '';
    }
});
