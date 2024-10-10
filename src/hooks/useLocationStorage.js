const get = (key) => {
    return localStorage[key] && JSON.parse(localStorage.getItem(key))
}

const set = (key, value) => {
    localStorage.setItem(key,JSON.stringify(value))
}

const useLocationStorage = () => {
    return {
        get,
        set
    }
}
export default useLocationStorage;