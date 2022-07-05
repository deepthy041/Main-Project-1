function addCart(proId){
  
    $.ajax({
        
        url:'/add-cart/'+proId,
        method:'get',
        success:(response)=>{
           console.log(response)
            if(response.status){

               let count=$('#cart-count').html() 
               count=parseInt(count)+1
               $("#cart-count").html(count)
            }
            if(response.productExist){
                Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Product Already Added',
                    showConfirmButton: false,
                    timer: 1500
                  })
            }

        }
    })
}