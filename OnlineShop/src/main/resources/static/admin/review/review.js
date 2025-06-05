const API_BASE_URL = 'http://localhost:8080/api';
const reviewsBody = document.getElementById('reviewsBody');
const noReviewsMessage = document.getElementById('noReviewsMessage');

async function fetchReviews() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');

    if (!productId) {
        alert('Không tìm thấy ID sản phẩm để lấy đánh giá!');
        window.location.href = '../product/product.html';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem đánh giá!');
            window.location.href = '../login.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy đánh giá: ${await response.text()}`);
        }

        const reviews = await response.json();
        console.log('Reviews Data:', reviews);

        reviewsBody.innerHTML = ''; // Xóa nội dung cũ
        if (reviews.length === 0) {
            noReviewsMessage.style.display = 'block';
            return;
        }

        noReviewsMessage.style.display = 'none';
        reviews.forEach(review => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${review.id}</td>
                <td>${review.userId}</td>
                <td>${review.rating}</td>
                <td>${review.comment}</td>
                <td>${new Date(review.createdAt).toLocaleString('vi-VN')}</td>
                <td>
                    <button class="delete-btn" onclick="deleteReview(${review.id}, ${review.userId})">Xóa</button>
                </td>
            `;
            reviewsBody.appendChild(row);
        });
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

async function deleteReview(reviewId, userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xóa đánh giá!');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error(`Không thể xóa đánh giá: ${await response.text()}`);
        }

        alert('Xóa đánh giá thành công!');
        fetchReviews(); // Làm mới danh sách
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function goBack() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');
    if (!productId) {
        alert('Không tìm thấy ID sản phẩm để quay lại!');
        window.location.href = '../product/product.html';
        return;
    }
    window.location.href = `../product/detail.html?id=${productId}`;
}

// Tải danh sách đánh giá khi trang được tải
document.addEventListener('DOMContentLoaded', fetchReviews);