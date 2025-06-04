// Lấy product.id từ URL parameter
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

async function fetchProductDetail() {
    try {
        const [productResponse, reviewsResponse] = await Promise.all([
            fetch(`http://localhost:8080/api/products/${productId}`),
            fetch(`http://localhost:8080/api/products/${productId}/reviews`)
        ]);
        if (productResponse.ok && reviewsResponse.ok) {
            const product = await productResponse.json();
            let reviews = await reviewsResponse.json();

            // Lấy fullName cho từng userId
            const userPromises = reviews.map(review =>
                fetch(`http://localhost:8080/api/auth/users/${review.userId}`)
                    .then(res => res.ok ? res.json() : Promise.reject('Không lấy được thông tin người dùng'))
                    .then(user => ({ ...review, fullName: user.fullName || 'Người dùng không xác định' }))
                    .catch(error => {
                        console.log(`Lỗi lấy thông tin người dùng ${review.userId}:`, error);
                        return { ...review, fullName: 'Người dùng không xác định' };
                    })
            );
            reviews = await Promise.all(userPromises);

            // Tính averageRating từ reviews nếu cần
            const averageRating = reviews.length > 0
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                : 0;
            displayProductDetail(product, reviews, averageRating);
        } else {
            console.log('Lỗi lấy chi tiết sản phẩm hoặc review:', await productResponse.text(), await reviewsResponse.text());
            document.getElementById('product-detail').innerHTML = '<p>Không tìm thấy sản phẩm hoặc review.</p>';
        }
    } catch (error) {
        console.log('Lỗi kết nối khi lấy chi tiết sản phẩm hoặc review:', error);
        document.getElementById('product-detail').innerHTML = '<p>Lỗi kết nối.</p>';
    }
}

function displayProductDetail(product, reviews, averageRating) {
    const detailDiv = document.getElementById('product-detail');
    const formattedPrice = product.price ? `Giá: đ${product.price.toLocaleString('vi-VN')}` : 'N/A';
    const formattedSalePrice = product.salePrice ? `đ${product.salePrice.toLocaleString('vi-VN')}` : null;

    // Lưu thông tin product vào biến toàn cục để sử dụng trong addToCart
    console.log('Product từ API:', product); // Kiểm tra product
    window.currentProduct = product;

    // Tính phần trăm giảm giá nếu salePrice tồn tại
    let discountPercentage = null;
    if (formattedSalePrice && product.price && product.salePrice !== null) {
        const discount = product.price - product.salePrice;
        discountPercentage = ((discount / product.price) * 100).toFixed(0); // Làm tròn đến số nguyên
    }

    // Hiển thị hình ảnh
    const defaultImage = 'https://d1hjkbq40fs2x4.cloudfront.net/2016-01-31/files/1045.jpg';
    let mainImageSrc = defaultImage;
    let thumbnailsHtml = '';

    // Nếu có product.images, lấy hình ảnh đầu tiên làm hình ảnh lớn
    if (Array.isArray(product.images) && product.images.length > 0) {
        mainImageSrc = product.images[0].url || defaultImage;
        thumbnailsHtml = product.images.map((img, index) =>
            `<img src="${img.url || defaultImage}" alt="${product.name} thumbnail ${index}" class="thumbnail-image" onclick="changeMainImage('${img.url || defaultImage}')" onerror="this.src='${defaultImage}'">`
        ).join('');
    } else if (product.imageUrl) {
        mainImageSrc = product.imageUrl || defaultImage;
        thumbnailsHtml = `<img src="${product.imageUrl || defaultImage}" alt="${product.name} thumbnail" class="thumbnail-image" onclick="changeMainImage('${product.imageUrl || defaultImage}')" onerror="this.src='${defaultImage}'">`;
    }

    // Hiển thị thông tin sản phẩm
    const descriptionParagraphs = product.description
        ? product.description.split('\n').filter(Boolean).map(line => `<p style="margin-top: 10px">${line || 'Chưa có mô tả'}</p>`).join('')
        : '<p>Chưa có mô tả</p>';

    const reviewItems = reviews.length > 0
        ? reviews.map(review => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating); // Tạo sao dựa trên rating
            const dateTime = new Date(review.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const comment = review.comment || 'Không có bình luận';
            return `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-user">${review.fullName}</span>
                    </div>
                    <div class="review-rating">${stars}</div>
                    <div class="review-date">${dateTime} | Phản hồi hàng</div>
                    <p class="review-comment">${comment}</p>
                </div>
            `;
        }).join('')
        : '<p>Chưa có đánh giá nào.</p>';

    const reviewCount = reviews.length; // Tổng số đánh giá

    const detailHtml = `
        <div class="product-container">
            <div class="image-section">
                <div class="main-image">
                    <img id="mainImage" src="${mainImageSrc}" alt="${product.name}" class="product-image" onerror="this.src='${defaultImage}'">
                </div>
                <div class="thumbnail-section">
                    ${thumbnailsHtml || `<img src="${defaultImage}" alt="${product.name} thumbnail" class="thumbnail-image" onclick="changeMainImage('${defaultImage}')">`}
                </div>
                <div class="quantity-section">
                    <label for="quantity">Số Lượng</label>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity()">-</button>
                        <input type="number" id="quantity" value="1" min="1" readonly>
                        <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="add-to-cart" onclick="addToCart(${product.id})"><i class="fa fa-shopping-cart"></i> Thêm Vào Giỏ Hàng</button>
                    <button class="buy-now" onclick="buyNow(${product.id})">Mua Ngay</button>
                </div>
<!--                <button class="add-to-cart mobile-only" onclick="addToCart(${product.id})"><i class="fa fa-shopping-cart"></i> Thêm Vào Giỏ Hàng</button>-->
            </div>
            <div class="info-section">
                <h2>${product.name}</h2>
                <div class="price-rating">
                    ${formattedSalePrice ? `
                        <p class="price-group">
                            <span class="original-price">${formattedPrice}</span>
                            <span class="discount-percentage" style="color: red;">-${discountPercentage}%</span>
                        </p>
                        <p class="sale-price">${formattedSalePrice}</p>
                    ` : `
                        <p style="font-weight: bold; color: blue;">${formattedPrice}</p>
                    `}
                    <p class="rating-number"><i class="fa fa-star"></i> ${averageRating}</p>
                </div>
                <div class="product-info-panel">
                    <h3>CHI TIẾT SẢN PHẨM</h3>
                    <div class="info-item"><strong>Danh mục:</strong> <span>${product.categoryName || 'Chưa có thông tin'}</span></div>
                    <div class="info-item"><strong>Số lượng trong kho:</strong> <span>${product.stock || 0}</span></div>
                    <div class="info-item"><strong>Số sản phẩm đã bán:</strong> <span>${product.soldQuantity || 0}</span></div>
                    <div class="info-item"><strong>Thương hiệu:</strong> <span>${product.brand || 'Chưa có thông tin'}</span></div>
                    <div class="info-item"><strong>Xuất xứ:</strong> <span>${product.origin || 'Chưa có thông tin'}</span></div>
                    <div class="info-item"><strong>Thời gian giao hàng:</strong> <span>1 tuần</span></div>
                    <div class="info-item"><strong>Gửi từ:</strong> <span>Hà Nội</span></div>
                </div>
                <div class="product-description">
                    <h3>MÔ TẢ SẢN PHẨM</h3>
                    ${descriptionParagraphs}
                </div>
            </div>
        </div>
        <div class="reviews-panel">
            <h3>Đánh giá từ người dùng <span class="review-count">(${reviewCount} đánh giá)</span></h3>
            ${reviewItems}
        </div>
    `;
    detailDiv.innerHTML = detailHtml;
}

// Hàm thay đổi hình ảnh lớn khi nhấn vào thumbnail
function changeMainImage(imageUrl) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imageUrl;
}

async function addToCart(productId) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const product = window.currentProduct; // Lấy thông tin sản phẩm từ biến toàn cục

    if (!product) {
        alert('Không tìm thấy thông tin sản phẩm!');
        return;
    }

    // Tính tổng tiền
    const priceToUse = product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price;
    const totalPrice = priceToUse * quantity;
    const formattedTotalPrice = `đ${totalPrice.toLocaleString('vi-VN')}`;

    // Hiển thị thông báo xác nhận
    const confirmMessage = `Bạn có muốn thêm "${product.name}" (x${quantity}) với tổng tiền ${formattedTotalPrice} vào giỏ hàng không?`;
    const userConfirmed = confirm(confirmMessage);

    if (userConfirmed) {
        const token = localStorage.getItem('token');
        console.log('Token:', token); // Kiểm tra token
        if (!token) {
            alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/api/cart/add?productId=${productId}&quantity=${quantity}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Phản hồi API:', response.status); // Kiểm tra phản hồi API
            if (response.ok) {
                alert('Thêm vào giỏ hàng thành công!');
                window.location.href = '/customer/cart/cart.html';
            } else {
                let errorMessage = 'Lỗi không xác định khi thêm vào giỏ hàng.';
                if (response.status === 401) {
                    errorMessage = 'Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!';
                } else if (response.status === 404) {
                    errorMessage = 'Sản phẩm hoặc người dùng không tồn tại.';
                } else if (response.status === 400) {
                    errorMessage = 'Số lượng không hợp lệ hoặc vượt quá tồn kho.';
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.log('Lỗi kết nối khi thêm vào giỏ hàng:', error);
            alert('Lỗi kết nối. Vui lòng thử lại sau!');
        }
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value);
    if (quantity > 1) {
        quantityInput.value = quantity - 1;
    }
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value);
    quantityInput.value = quantity + 1;
}

function buyNow(productId) {
    const quantity = parseInt(document.getElementById('quantity').value);
    alert(`Mua ngay "${document.querySelector('h2').textContent}" với số lượng ${quantity}!`); // Placeholder, thay bằng logic thực tế
    // Ví dụ: window.location.href = `/checkout?productId=${productId}&quantity=${quantity}`;
}

function test(productId) {
    console.log("Thêm vào giỏ hàng ", productId)
}

// Khởi chạy khi trang load
document.addEventListener('DOMContentLoaded', () => {
    if (productId) {
        fetchProductDetail();
    } else {
        document.getElementById('product-detail').innerHTML = '<p>Không có ID sản phẩm.</p>';
    }
});