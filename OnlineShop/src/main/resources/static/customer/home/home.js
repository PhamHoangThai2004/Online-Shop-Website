let allProducts = [];
let allCategories = [];

async function fetchCategories() {
    try {
        const response = await fetch('http://localhost:8080/api/categories');
        allCategories = await response.json();
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';
        allCategories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = category.name;
            li.onclick = () => fetchProductsByCategory(category.id, category.name);
            categoryList.appendChild(li);
        });
    } catch (error) {
        console.log('Lỗi lấy danh mục:', error);
    }
}

async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:8080/api/products');
        allProducts = await response.json();
        for (let product of allProducts) {
            product.averageRating = await fetchProductRating(product.id);
        }
        displayProducts(allProducts, "Tất cả sản phẩm");
    } catch (error) {
        console.log('Lỗi lấy sản phẩm:', error);
    }
}

async function fetchProductsByCategory(categoryId, categoryName) {
    try {
        const response = await fetch(`http://localhost:8080/api/products?categoryId=${categoryId}`);
        if (response.status === 204) {
            allProducts = [];
        } else {
            allProducts = await response.json();
            for (let product of allProducts) {
                product.averageRating = await fetchProductRating(product.id);
            }
        }
        displayProducts(allProducts, categoryName);
    } catch (error) {
        console.log('Lỗi lấy sản phẩm theo danh mục:', error);
    }
}

async function searchProducts() {
    const keyword = document.getElementById('searchInput').value.trim();
    try {
        const response = await fetch(`http://localhost:8080/api/products/search-by-keyword?keyword=${encodeURIComponent(keyword)}`);
        if (response.ok) {
            allProducts = await response.json();
            for (let product of allProducts) {
                product.averageRating = await fetchProductRating(product.id);
            }
            displayProducts(allProducts, `Kết quả tìm kiếm: ${keyword || "Tất cả sản phẩm"}`);
        } else {
            console.log('Lỗi tìm kiếm:', await response.text());
            displayProducts([], "Không tìm thấy kết quả");
        }
    } catch (error) {
        console.log('Lỗi kết nối khi tìm kiếm:', error);
        displayProducts([], "Lỗi kết nối khi tìm kiếm");
    }
}

async function fetchProductRating(productId) {
    try {
        const response = await fetch(`http://localhost:8080/api/products/${productId}/reviews`);
        if (response.ok) {
            const reviews = await response.json();
            if (reviews.length === 0) return 0;
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            return totalRating / reviews.length;
        }
        return 0;
    } catch (error) {
        console.log('Lỗi lấy review:', error);
        return 0;
    }
}

const defaultImage = 'https://d1hjkbq40fs2x4.cloudfront.net/2016-01-31/files/1045.jpg';

function displayProducts(products, title) {
    const productList = document.getElementById('productList');
    const productTitle = document.getElementById('productTitle');
    productTitle.textContent = title;

    productList.innerHTML = '';
    if (products.length === 0) {
        const noProductsDiv = document.createElement('div');
        noProductsDiv.className = 'no-products';
        noProductsDiv.textContent = 'Không có sản phẩm nào';
        productList.appendChild(noProductsDiv);
    } else {
        products.forEach(product => {
            const div = document.createElement('div');
            div.className = 'product-card';
            const formattedPrice = product.price ? `đ${product.price.toLocaleString('vi-VN')}` : 'N/A';
            const formattedSalePrice = product.salePrice ? `đ${product.salePrice.toLocaleString('vi-VN')}` : null;
            const priceClass = formattedSalePrice ? 'original-price' : 'regular-price';

            const imageUrl = Array.isArray(product.images) && product.images.length > 0
                ? (product.images[0].url || defaultImage)
                : defaultImage;

            div.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='${defaultImage}'">
                <h4>${product.name}</h4>
                <p class="${priceClass}">Giá: ${formattedPrice}</p>
                ${formattedSalePrice ? `<p class="sale-price">${formattedSalePrice}</p>` : ''}
                <p class="sold-quantity">Đã bán: ${product.soldQuantity || 0}</p>
                <p class="rating-number"><i class="fa fa-star"></i> ${(product.averageRating || 0).toFixed(1)}</p>
                <button class="add-to-cart" onclick="addCart(${product.id}); event.stopPropagation()">Thêm vào giỏ hàng</button>
            `;
            div.onclick = () => {
                window.location.href = `/customer/detail-product/detail-product.html?id=${product.id}`;
            };
            productList.appendChild(div);
        });
    }
}

function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    let sortedProducts = [...allProducts];

    if (sortValue === 'priceAsc') {
        sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortValue === 'priceDesc') {
        sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    displayProducts(sortedProducts, document.getElementById('productTitle').textContent);
}

async function addCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
        window.location.href = '/customer/login/login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/cart/add?productId=${productId}&quantity=1`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const product = allProducts.find(p => p.id === productId);
            alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
            updateCartCount();
            window.location.href = '/customer/cart/cart.html';
        } else {
            let errorMessage = 'Lỗi khi thêm sản phẩm vào giỏ hàng.';
            if (response.status === 401) {
                errorMessage = 'Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!';
                window.location.href = '/customer/login/login.html';
            } else if (response.status === 400) {
                errorMessage = 'Số lượng không hợp lệ hoặc vượt quá tồn kho.';
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.log('Lỗi kết nối khi thêm sản phẩm vào giỏ hàng:', error);
        alert('Lỗi kết nối. Vui lòng thử lại sau!');
    }
}

async function fetchUserInfo() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('http://localhost:8080/api/auth/user/info', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const userInfo = document.getElementById('userInfo');
            const userSection = document.getElementById('userSection');
            userInfo.textContent = `Xin chào, ${data.username || 'Người dùng'}`;
            userSection.style.display = 'flex';
            updateCartCount();
        } catch (error) {
            console.log('Lỗi lấy thông tin người dùng:', error);
        }
    }
}

async function updateCartCount() {
    const token = localStorage.getItem('token');
    const cartCountElement = document.getElementById('cart-count');

    if (!token) {
        cartCountElement.textContent = '0';
        cartCountElement.setAttribute('data-count', '0');
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/cart/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const cartData = await response.json();
            const cartItems = Array.isArray(cartData.items) ? cartData.items : (cartData.cart?.items || []);
            const itemCount = cartItems.length;
            cartCountElement.textContent = itemCount;
            cartCountElement.setAttribute('data-count', itemCount);
        } else {
            if (response.status === 401) {
                cartCountElement.textContent = '0';
                cartCountElement.setAttribute('data-count', '0');
                localStorage.removeItem('token');
            } else {
                cartCountElement.textContent = '0';
                cartCountElement.setAttribute('data-count', '0');
            }
        }
    } catch (error) {
        console.error('Lỗi khi lấy số lượng giỏ hàng:', error);
        cartCountElement.textContent = '0';
        cartCountElement.setAttribute('data-count', '0');
    }
}

function logout() {
    localStorage.removeItem('token');
    const userSection = document.getElementById('userSection');
    userSection.style.display = 'none';
    window.location.href = '/index.html';
}

function resetPage() {
    document.getElementById('searchInput').value = '';
    fetchProducts();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchProducts();
    fetchUserInfo();
});