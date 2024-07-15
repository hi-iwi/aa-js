const nif = () => void 0   // 空函数  ==>  Go语言都定义 any = interface{}，这里定义要给 nif 是有必要的


const aparam = {
    // 退出登录时，不清空的数据
    logout              : "logout",
    dbgWeixinAccessToken: "dbg_wx_token",
    dbgAccessToken      : "dbg_access_token",
    weixinToken         : "wx_access_token",


    userGrowthFrom      : "f",
    debug               : "_debug",
    alert               : "_alert",
    headerAuthorization : "Authorization",// header 里面，
    apollo              : "apollo",  // 阿波罗计划
    accessTokenType     : "token_type",
    accessToken         : "access_token",  // header/query/cookie
    accessTokenExpiresIn: "expires_in",
    accessTokenConflict : "conflict",
    refreshToken        : "refresh_token",
    scope               : "scope",
    scopeAdmin          : "admin",

    taWeixinState: "state",


    localAuthAt: "local_auth_at",
}
