const API_BASE_URL = 'http://localhost:8080/api/products';
const productTableBody = document.getElementById('productTableBody');
const createProductSection = document.getElementById('createProductSection');
const productListSection = document.getElementById('productListSection');
const toggleCreateFormButton = document.getElementById('toggleCreateFormButton');
const cancelCreateButton = document.getElementById('cancelCreateButton');
const categorySelect = document.getElementById('category');

async function fetchCategories() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để lấy danh sách danh mục');
            return;
        }

        // Giả định API để lấy danh mục (thay bằng API thực tế của bạn, ví dụ: /api/categories)
        const response = await fetch('http://localhost:8080/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy danh sách danh mục: ${await response.text()}`);
        }

        const categories = await response.json();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

async function fetchAndRenderProducts() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem danh sách sản phẩm');
            return;
        }

        const response = await fetch(API_BASE_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy danh sách sản phẩm: ${await response.text()}`);
        }

        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function renderProducts(products) {
    productTableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.price}</td>
            <td>${product.stock}</td>
            <td>
                <button onclick="updateProduct(${product.id})">Cập nhật</button>
                <button onclick="deleteProduct(${product.id})">Xóa</button>
            </td>
        `;
        productTableBody.appendChild(row);
    });
}

async function createProduct(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để tạo sản phẩm');
        return;
    }

    const productData = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        salePrice: document.getElementById('salePrice').value ? parseFloat(document.getElementById('salePrice').value) : null,
        description: document.getElementById('description').value,
        stock: parseInt(document.getElementById('stock').value),
        brand: document.getElementById('brand').value,
        origin: document.getElementById('origin').value,
        category: { id: parseInt(document.getElementById('category').value) }
    };

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error(`Không thể tạo sản phẩm: ${await response.text()}`);
        }

        alert('Thêm sản phẩm thành công');
        document.getElementById('createProductForm').reset();
        toggleCreateForm();
        fetchAndRenderProducts();
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

async function updateProduct(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để cập nhật sản phẩm');
        return;
    }

    window.location.href = `detail.html?id=${id}`;
}

async function deleteProduct(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để xóa sản phẩm');
        return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Không thể xóa sản phẩm: ${await response.text()}`);
            }

            alert('Xóa sản phẩm thành công');
            fetchAndRenderProducts();
        } catch (error) {
            console.error('Lỗi:', error);
            alert(`Đã có lỗi xảy ra: ${error.message}`);
        }
    }
}

function toggleCreateForm() {
    if (createProductSection.style.display === 'none') {
        createProductSection.style.display = 'block';
        productListSection.style.display = 'none';
        toggleCreateFormButton.textContent = 'Hủy Thêm Sản Phẩm';
    } else {
        createProductSection.style.display = 'none';
        productListSection.style.display = 'block';
        toggleCreateFormButton.textContent = 'Thêm Sản Phẩm';
        document.getElementById('createProductForm').reset();
    }
}

// Gắn sự kiện cho nút "Thêm Sản Phẩm"
toggleCreateFormButton.addEventListener('click', toggleCreateForm);

// Gắn sự kiện cho nút "Hủy"
cancelCreateButton.addEventListener('click', toggleCreateForm);

// Gắn sự kiện cho form tạo sản phẩm
document.getElementById('createProductForm').addEventListener('submit', createProduct);

// Tải danh sách danh mục và sản phẩm khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchAndRenderProducts();
});