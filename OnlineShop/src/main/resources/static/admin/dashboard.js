document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    const logoutModal = document.getElementById('logoutModal');
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');

    function logoutAdmin() {
        localStorage.removeItem('token'); // Xóa token khỏi localStorage
        window.location.href = 'http://localhost:8080/';
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (logoutModal) {
                logoutModal.style.display = 'flex';
            }
        });
    }

    if (noButton) {
        noButton.addEventListener('click', function() {
            if (logoutModal) {
                logoutModal.style.display = 'none';
            }
        });
    }

    if (yesButton) {
        yesButton.addEventListener('click', function() {
            logoutAdmin();
        });
    }

    if (logoutModal) {
        logoutModal.addEventListener('click', function(event) {
            if (event.target === logoutModal) {
                logoutModal.style.display = 'none';
            }
        });
    }
});