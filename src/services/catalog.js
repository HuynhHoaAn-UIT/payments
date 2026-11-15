// UI-only sample catalog. No Product Service and no invented backend endpoints.
// Replace these sample items with your own demo display data if needed.
export const products = [
 {id:1,name:'Nike Air Max Style',description:'Demo product',price:2800000,imageUrl:''},
 {id:2,name:'Adidas Street Runner',description:'Demo product',price:2200000,imageUrl:''},
 {id:3,name:'Retro Running Shoes',description:'Demo product',price:2100000,imageUrl:''}
];
export const money = n => '₫' + Number(n || 0).toLocaleString('vi-VN');
