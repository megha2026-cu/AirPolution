document.addEventListener('DOMContentLoaded', function () {
    if (Auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorEl.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(API_BASE + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            Auth.setToken(data.token);
            window.location.href = 'index.html';
        } catch (err) {
            errorEl.textContent = err.message || 'Login failed. Please try again.';
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
});
