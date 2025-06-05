const API_BASE_URL = 'http://localhost:8080/api/products';
const updateProductForm = document.getElementById('updateProductForm');
const categorySelect = document.getElementById('category');

async function fetchCategories() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để lấy danh sách danh mục');
            return;
        }

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

async function fetchAndPopulateProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('Không tìm thấy ID sản phẩm');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để chỉnh sửa sản phẩm');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy chi tiết sản phẩm: ${await response.text()}`);
        }

        const product = await response.json();
        document.getElementById('id').value = product.id;
        document.getElementById('name').value = product.name;
        document.getElementById('price').value = product.price;
        document.getElementById('salePrice').value = product.salePrice || '';
        document.getElementById('description').value = product.description || '';
        document.getElementById('stock').value = product.stock;
        document.getElementById('brand').value = product.brand || '';
        document.getElementById('origin').value = product.origin || '';
        document.getElementById('category').value = product.categoryName ? product.categoryName.id : '';
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

async function updateProduct(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để cập nhật sản phẩm');
        return;
    }

    const productId = document.getElementById('id').value;
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
        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error(`Không thể cập nhật sản phẩm: ${await response.text()}`);
        }

        alert('Cập nhật sản phẩm thành công');
        window.location.href = 'product.html';
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

// Gắn sự kiện cho form cập nhật
updateProductForm.addEventListener('submit', updateProduct);

// Tải danh sách danh mục và thông tin sản phẩm khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchAndPopulateProduct();
});