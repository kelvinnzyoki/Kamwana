export type Product={id:string;name:string;slug:string;description:string;price:string|number;compareAtPrice?:string|number|null;image:string;images:string[];category:string;badge?:string|null;stock:number;isFeatured:boolean;};
export type CartItem={id:string;quantity:number;price:string|number;product:Product};
export type Cart={id:string;items:CartItem[]};
export type Order={id:string;orderNumber:string;status:string;total:string|number;paymentMethod:'MPESA'|'PAYSTACK';items:{productName:string;quantity:number;total:string|number}[]};
