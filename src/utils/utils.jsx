export function protectPhone(phone) {
    let a = phone.substring(0, 2);
    let b = phone.substring(7);

    return `${a}*****${b}`;
}

export function protectEmail(email) {
    let split = email.split("@");
    let a = split[0].substring(0, 2);
    let b = split[1][0];
    let c = split[1].substring(split[1].lastIndexOf("."));

    return `${a}****@${b}***${c}`;
}

export function isValidEmail(email){
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return emailRegex.test(email);
}
