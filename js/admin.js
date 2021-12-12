// 變數定義
let orderData = [];
const orderList = document.querySelector('.js-orderList');
const discardAllBtn = document.querySelector('.discardAllBtn');

// 取得訂單列表
function getOrderList() {
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
    {
        headers: {
            'Authorization': token,
        }
    }).then(function (response) {
        orderData = response.data.orders;        
        let str = '';
        orderData.forEach(function(item) {
            // 組時間字串
            const timeStamp = new Date(item.createdAt * 1000);
            const orderTime = `${timeStamp.getFullYear()}/${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;

            // 組產品字串
            let productStr = '';
            item.products.forEach(function(productItem) {
                productStr += `<p>${productItem.title} x ${productItem.quantity}</p>`;
            })

            // 判斷訂單處理狀態 
            let orderStatus = '';
            if(item.paid == true) {
                orderStatus = '已處理';
            }
            else {
                orderStatus = '未處理';
            }

            // 組訂單字串
            str += 
            `<tr>
                <td>${item.id}</td>   
                <td>
                    <p>${item.user.name}</p>
                    <p>${item.user.tel}</p>
                </td>         
                <td>${item.user.address}</td>
                <td>${item.user.email}</td>
                <td>
                    ${productStr}
                </td>
                <td>${orderTime}</td>
                <td class="js-orderStatus">
                    <a href="#" class="orderStatus" data-status='${item.paid}' data-id='${item.id}'>${orderStatus}</a>
                </td>
                <td>
                    <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id='${item.id}' value="刪除">
                </td>    
            </tr>`;                                                                                                      
        })
        orderList.innerHTML = str;
        renderC3();
    }).catch(function(error){
        alert(error.response.data.message);
    })
}

// 刪除特定訂單
function deleteOrderItem(id) {
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders/${id}`,
    {
      headers: {
        'Authorization': token
      }
    }).then(function (response) {
        alert('刪除該筆訂單成功');
        getOrderList();  
    }).catch(function(error){
        alert(error.response.data.message);
    })
}

// 更改訂單狀態
function changeOrderStatus(status, id) {
    let newStatus;
    if(status == true) {
        newStatus = false;
    }
    else {
        newStatus = true;
    }
    axios.put(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
    {
      "data": {
        "id": id,
        "paid": newStatus
      }
    },
    {
      headers: {
        'Authorization': token
      }
    }).then(function (response) {
        alert('更改訂單狀態成功');
        getOrderList();
    }).catch(function(error){
        alert(error.response.data.message);
    })
}

// 渲染全品項營收比重圖表
function renderC3() {
    // 資料蒐集
    let obj = {};
    orderData.forEach(function(item) {
        item.products.forEach(function(productItem) {
            if(obj[productItem.title] === undefined) {
                obj[productItem.title] = productItem.price * productItem.quantity;
            }
            else {
                obj[productItem.title] += productItem.price * productItem.quantity;
            }
        })
    })

    // 資料關聯
    let originAry = Object.keys(obj);
    let rankSortAry = [];
    originAry.forEach(function(item) {
        let ary = [];
        ary.push(item);
        ary.push(obj[item]);
        rankSortAry.push(ary);
    })

    // 排序 
    rankSortAry.sort(function(a, b) {      
        return b[1] - a[1];
    })

    // 如果超過 4 筆以上，統整為其他
    if(rankSortAry.length > 3) {
        let otherTotal = 0;
        rankSortAry.forEach(function(item, index) {
            if(index > 2) {                
                otherTotal += rankSortAry[index][1];                
            }
        })
        rankSortAry.splice(3, rankSortAry.length - 1);
        rankSortAry.push(['其他', otherTotal]);        
    }

    // 產生圖表
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: rankSortAry,          
        },
    });
}

// 初始化
function init() {
    getOrderList();
}

// 監聽訂單列表
orderList.addEventListener('click', function(e) {
    e.preventDefault();
    const targetClass = e.target.getAttribute('class');    
    let id = e.target.getAttribute('data-id');

    // 訂單刪除
    if(targetClass == 'delSingleOrder-Btn js-orderDelete') {                        
        deleteOrderItem(id);
        return;
    }

    // 訂單狀態
    if(targetClass == "orderStatus") { 
        let status = e.target.getAttribute('data-status'); 
        changeOrderStatus(status, id);
        return;
    }
})

// 清除全部訂單
discardAllBtn.addEventListener('click', function(e) {
    e.preventDefault();
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
    {
      headers: {
        'Authorization': token
      }
    }).then(function (response) {
      alert('刪除全部訂單成功');
      getOrderList();
    }).catch(function(error){
        alert(error.response.data.message);
    })
})

init();
