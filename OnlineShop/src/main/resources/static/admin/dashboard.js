document.addEventListener('DOMContentLoaded', function() {
    // Lấy các phần tử cần thiết từ DOM
    const logoutButton = document.getElementById('logoutButton');
    const logoutModal = document.getElementById('logoutModal');
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');

    // Hàm thực hiện logic đăng xuất
    // Hàm này sẽ xóa token và chuyển hướng người dùng
    function logoutAdmin() {
        localStorage.removeItem('token'); // Xóa token khỏi localStorage
        // Bạn có thể thêm các hành động dọn dẹp session khác nếu cần cho Admin
        // Đảm bảo đường dẫn này đúng với trang đăng nhập hoặc trang chủ của bạn
        window.location.href = 'http://localhost:8080/';
    }

    // Gán sự kiện cho nút "Đăng xuất" trong sidebar
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ <a> (chuyển hướng)
            if (logoutModal) {
                logoutModal.style.display = 'flex'; // Hiển thị modal xác nhận
            }
        });
    }

    // Gán sự kiện cho nút "Không" trong modal
    // Khi nhấn "Không", modal sẽ được ẩn đi
    if (noButton) {
        noButton.addEventListener('click', function() {
            if (logoutModal) {
                logoutModal.style.display = 'none'; // Ẩn modal
            }
        });
    }

    // Gán sự kiện cho nút "Có" trong modal
    // Khi nhấn "Có", hàm logoutAdmin sẽ được gọi để thực hiện đăng xuất
    if (yesButton) {
        yesButton.addEventListener('click', function() {
            logoutAdmin(); // Gọi hàm đăng xuất
        });
    }

    // Gán sự kiện để ẩn modal khi nhấp ra bên ngoài nội dung modal
    if (logoutModal) {
        logoutModal.addEventListener('click', function(event) {
            // Kiểm tra nếu click trực tiếp vào lớp phủ modal chứ không phải nội dung modal
            if (event.target === logoutModal) {
                logoutModal.style.display = 'none'; // Ẩn modal
            }
        });
    }
});