export const money=(n:number|string)=>new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES'}).format(Number(n));
