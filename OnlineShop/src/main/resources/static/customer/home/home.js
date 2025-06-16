let allProducts = [];
let allCategories = [];
let currentPage = 0;
let pageSize = 6;
let totalPages = 1;
let selectedCategoryId = null;

async function fetchCategories() {
    try {
        const response = await fetch('http://localhost:8080/api/categories');
        allCategories = await response.json();
        const categoryList = document.getElementById('categoryList');
        const filterCategory = document.getElementById('filterCategory');
        categoryList.innerHTML = '';
        filterCategory.innerHTML = '<option value="">Tất cả danh mục</option>';
        allCategories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = category.name;
            li.onclick = () => {
                selectedCategoryId = category.id;
                fetchProductsByCategory(category.id, category.name);
            };
            categoryList.appendChild(li);

            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterCategory.appendChild(option);
        });
    } catch (error) {
        console.log('Lỗi lấy danh mục:', error);
    }
}

async function fetchProducts(page = 0) {
    try {
        const response = await fetch(`http://localhost:8080/api/products?page=${page}&size=${pageSize}&sort=id,asc`);
        const data = await response.json();
        allProducts = data.content;
        totalPages = data.totalPages;
        currentPage = data.number;
        for (let product of allProducts) {
            product.averageRating = await fetchProductRating(product.id);
        }
        displayProducts(allProducts, "Tất cả sản phẩm");
        updatePagination();
    } catch (error) {
        console.log('Lỗi lấy sản phẩm:', error);
    }
}

async function fetchProductsByCategory(categoryId, categoryName, page = 0) {
    try {
        const response = await fetch(`http://localhost:8080/api/products?categoryId=${categoryId}&page=${page}&size=${pageSize}&sort=id,asc`);
        const data = await response.json();
        allProducts = data.content;
        totalPages = data.totalPages;
        currentPage = data.number;
        for (let product of allProducts) {
            product.averageRating = await fetchProductRating(product.id);
        }
        displayProducts(allProducts, categoryName);
        updatePagination();
    } catch (error) {
        console.log('Lỗi lấy sản phẩm theo danh mục:', error);
    }
}

async function searchProducts(page = 0) {
    const keyword = document.getElementById('searchInput').value.trim();
    if (keyword.length <= 0) return;
    try {
        const response = await fetch(`http://localhost:8080/api/products/search-by-keyword?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${pageSize}&sort=id,asc`);
        if (response.ok) {
            const data = await response.json();
            allProducts = data.content;
            totalPages = data.totalPages;
            currentPage = data.number;
            for (let product of allProducts) {
                product.averageRating = await fetchProductRating(product.id);
            }
            displayProducts(allProducts, `Kết quả tìm kiếm: ${keyword}`);
            updatePagination();
        } else {
            displayProducts([], "Không tìm thấy kết quả");
            totalPages = 1;
            updatePagination();
        }
    } catch (error) {
        console.log('Lỗi kết nối khi tìm kiếm:', error);
        displayProducts([], "Lỗi kết nối khi tìm kiếm");
        totalPages = 1;
        updatePagination();
    }
}

async function applyFilters(page = 0) {
    const keyword = document.getElementById('filterKeyword').value.trim();
    const categoryId = document.getElementById('filterCategory').value || null;
    const minPrice = document.getElementById('filterMinPrice').value ? parseFloat(document.getElementById('filterMinPrice').value) : null;
    const maxPrice = document.getElementById('filterMaxPrice').value ? parseFloat(document.getElementById('filterMaxPrice').value) : null;
    const inStock = document.getElementById('filterInStock').checked;

    const url = new URL(`http://localhost:8080/api/products/search`);
    const params = {
        page,
        size: pageSize,
        sort: 'id,asc',
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        inStock: inStock || undefined
    };
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    url.search = new URLSearchParams(params).toString();

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            allProducts = data.content;
            totalPages = data.totalPages;
            currentPage = data.number;
            for (let product of allProducts) {
                product.averageRating = await fetchProductRating(product.id);
            }
            displayProducts(allProducts, "Kết quả bộ lọc");
            updatePagination();
        } else {
            displayProducts([], "Không tìm thấy sản phẩm nào");
            totalPages = 1;
            updatePagination();
        }
    } catch (error) {
        console.log('Lỗi kết nối khi áp dụng bộ lọc:', error);
        displayProducts([], "Lỗi kết nối khi áp dụng bộ lọc");
        totalPages = 1;
        updatePagination();
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
                <div class="price-wrapper">
                    <span class="${priceClass}">${formattedPrice}</span>
                    ${formattedSalePrice ? `<span class="sale-price">${formattedSalePrice}</span>` : ''}
                </div>
                <div class="info-wrapper">
                    <span class="rating-number"><i class="fa fa-star"></i> ${(product.averageRating || 0).toFixed(1)}</span>
                    <span class="sold-quantity">Đã bán: ${product.soldQuantity || 0}</span>
                </div>
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

function updatePagination() {
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbersDiv = document.getElementById('pageNumbers');
    pageNumbersDiv.innerHTML = '';

    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage === totalPages - 1;

    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages);

    if (endPage - startPage < maxVisiblePages) {
        startPage = Math.max(0, endPage - maxVisiblePages);
    }

    if (startPage > 0) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.textContent = '1';
        firstPageBtn.onclick = () => goToPage(0);
        pageNumbersDiv.appendChild(firstPageBtn);
        if (startPage > 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pageNumbersDiv.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i < endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i + 1;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.onclick = () => goToPage(i);
        pageNumbersDiv.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pageNumbersDiv.appendChild(ellipsis);
        }
        const lastPageBtn = document.createElement('button');
        lastPageBtn.textContent = totalPages;
        lastPageBtn.onclick = () => goToPage(totalPages - 1);
        pageNumbersDiv.appendChild(lastPageBtn);
    }
}

function goToPage(page) {
    currentPage = page;
    const title = document.getElementById('productTitle').textContent;
    if (title.startsWith('Kết quả tìm kiếm')) {
        searchProducts(currentPage);
    } else if (title.startsWith('Kết quả bộ lọc')) {
        applyFilters(currentPage);
    } else if (title !== 'Tất cả sản phẩm') {
        const categoryId = allCategories.find(cat => cat.name === title)?.id;
        fetchProductsByCategory(categoryId, title, currentPage);
    } else {
        fetchProducts(currentPage);
    }
}

function prevPage() {
    if (currentPage > 0) {
        goToPage(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
    }
}

async function addCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
        window.location.href = '/auth/login.html';
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
                window.location.href = 'auth/login.html';
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
    document.getElementById('filterKeyword').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterMinPrice').value = '';
    document.getElementById('filterMaxPrice').value = '';
    document.getElementById('filterInStock').checked = false;
    currentPage = 0;
    fetchProducts(currentPage);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchProducts();
    fetchUserInfo();
});