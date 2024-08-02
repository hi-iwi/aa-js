class AaValidator {
    /**
     * Is a phone number of a country
     * @param {NumberX} countryCode
     * @param {NumberX} s
     * @todo support phone numbers of other countries
     */
    static isPhoneNumber(countryCode, s) {
        s = string(s)
        return /1\d{10}/.test(s)
    }

}