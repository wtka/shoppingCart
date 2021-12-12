// 變數定義
const productList = document.querySelector('.productWrap');
const productSelect = document.querySelector('.productSelect');
const cartList = document.querySelector('.shoppingCart-tableList');
const discardAllBtn = document.querySelector('.discardAllBtn');
const orderInfoBtn = document.querySelector('.orderInfo-btn');
const form = document.querySelector('.orderInfo-form');
const constraints = {
  "姓名": {
    presence: {
      message: "^姓名為必填欄位"
    },
    format: {
      pattern: '^[\u4e00-\u9fa5_a-zA-Z]+$',      
      message: '^格式錯誤'
    },    
  },
  "電話": {
    presence: {
      message: "^電話為必填欄位"
    },
    format: {
      pattern: '^09[0-9]{8}',      
      message: '^格式錯誤'
    },   
  },
  "Email": {
    email: {      
      email: true, // 需要符合 Email 格式
      message: '^格式錯誤'
    },
    presence: {
      message: "^信箱為必填欄位"
    },    
  },
  "寄送地址": {
    presence: {
      message: "^寄送地址為必填欄位"
    },
  }
};  
let productData = [];
let cartData = [];

// 取得產品列表
function getProductList() {
  axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`).then(function (response) {
      productData = response.data.products;      
      renderProductList();
    })
    .catch(function(error){
      alert(error.response.data.message);
    })
}

// 渲染產品列表
function renderProductList() {
  let str = '';
  productData.forEach(function(item) {
    str += combineProductHTMLItem(item);
  })
  productList.innerHTML = str;
}

// 組合產品內容
function combineProductHTMLItem(item) {
  return `<li class="productCard">
    <h4 class="productType">新品</h4>
    <img src="${item.images}" alt="">
    <a href="#" class="js-addCart" id="addCardBtn" data-id='${item.id}' data-title='${item.title}'>加入購物車</a>
    <h3>${item.title}</h3>
    <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
    <p class="nowPrice">NT$${toThousands(item.price)}</p>
    </li>`;
}

// 取得購物車列表
function getCartList() {
  axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`).then(function (response) {
      document.querySelector('.js-total').textContent = toThousands(response.data.finalTotal);
      cartData = response.data.carts;
      let str = '';
      cartData.forEach(function(item) {
        str += `<tr>
          <td>
            <div class="cardItem-title">
              <img src="${item.product.images}" alt="">
              <p>${item.product.title}</p>
            </div>
          </td>
          <td>NT$${toThousands(item.product.price)}</td>
          <td>${item.quantity}</td>
          <td>NT$${toThousands(item.product.price * item.quantity)}</td>
          <td class="discardBtn">
            <a href="#" class="material-icons js-discard" data-id='${item.id}' data-title='${item.product.title}'>clear</a>
          </td>
        </tr>`
      });      
      cartList.innerHTML = str;
    })
    .catch(function(error){
      alert(error.response.data.message);
    })
}

// 數字轉千分位 
function toThousands(num) {
  let parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// 初始化
function init() {
  getProductList();
  getCartList();
}

// 驗證表單 
function validateForm() {    
  let errors = validate(form, constraints);  
  console.log(errors);
  if(errors) {
    Object.keys(errors).forEach(function (keys) {            
      document.querySelector(`[data-message="${keys}"]`).textContent = errors[keys];
    })    
  }  
  return errors;
}

// 監聽品項列表
productSelect.addEventListener('change', function(e) {
  const category = e.target.value;
  if(category === '全部') {
    renderProductList();
    return;
  }
  let str = '';
  productData.forEach(function(item) {
    if(item.category === category) {
      str += combineProductHTMLItem(item);
    }    
  })
  productList.innerHTML = str;
})

// 新增產品至購物車
productList.addEventListener('click', function(e) {
  e.preventDefault(); // 防止回到頂端
  let addCartClass = e.target.getAttribute('class');
  if(addCartClass !== 'js-addCart') {
    return;
  }
  let productID = e.target.getAttribute('data-id');
  let numCheck = 1;  

  cartData.forEach(function(item) {
    if(item.product.id === productID) {
      numCheck = item.quantity += 1;
    }    
  })  

  axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`, {
    data: {
      "productId": productID,
      "quantity": numCheck
    }
  }).then(function (response) {    
    getCartList();
  }).catch(function(error){
    alert(error.response.data.message);
  })
})

// 刪除購物車產品
cartList.addEventListener('click', function(e) {
  e.preventDefault();  
  const cartId = e.target.getAttribute('data-id');
  if(cartId == null) {
    return;
  }
  axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`).then(function (response) {
    alert('刪除' + e.target.getAttribute('data-title') + '成功');
    getCartList();
  }).catch(function(error){
    alert(error.response.data.message);
  })
})

// 清除購物車內全部產品 
discardAllBtn.addEventListener('click', function(e) {
  e.preventDefault();
  axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`).then(function (response) {    
    alert('刪除全部購物車成功');
    getCartList();
  }).catch(function(error){
    alert(error.response.data.message);
  })
})

// 送出訂單 
orderInfoBtn.addEventListener('click', function(e) {
  e.preventDefault();
  if(cartData.length == 0) {
    alert('請新增產品至購物車');
    return;
  }
  const customerName = document.querySelector('#customerName').value;
  const customerPhone = document.querySelector('#customerPhone').value;
  const customerEmail = document.querySelector('#customerEmail').value;
  const customerAddress = document.querySelector('#customerAddress').value;
  const customerTradeWay = document.querySelector('#tradeWay').value;  
  let success = validateForm();
  if(success === undefined) {
    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`,
      {
        "data": {
          "user": {
            "name": customerName,
            "tel": customerPhone,
            "email": customerEmail,
            "address": customerAddress,
            "payment": customerTradeWay
          }
        }
      }
    ).then(function (response) {
      alert('訂單建立成功');
      document.querySelector('#customerName').value = '';
      document.querySelector('#customerPhone').value = '';
      document.querySelector('#customerEmail').value = '';
      document.querySelector('#customerAddress').value = '';
      document.querySelector('#tradeWay').value = 'ATM';
      getCartList();
    }).catch(function(error){
      alert(error.response.data.message);
    })   
  }  
})

init();