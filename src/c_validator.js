class AaValidator {
    /**
     * Is a phone number of a country
     * @param {number} countryCode
     * @param {string} s
     * @todo support phone numbers of other countries
     */
    static isPhoneNumber(countryCode, s) {
        return /1\d{10}/.test(s)
    }

}