/** @note this is an auto-generated file, do not modify it! */

/** @typedef {".json"|"application/json"|".jpg"|"image/jpeg"|".jpeg"|".png"|"image/png"|".gif"|"image/gif"|".webp"|"image/webp"|".heic"|"image/heic"|".heif"|".avci"|"image/heif"|".ico"|"image/vnd.microsoft.icon"|"image/x-icon"|".svg"|"image/svg+xml"|".mp3"|"audio/mpeg"|"audio/mp3"|".3gp"|"audio/3gpp"|".3g2"|"audio/3gpp2"|".aiff"|"audio/aiff"|".aif"|".aifc"|"audio/x-aiff"|".wav"|"audio/wav"|".webm"|"audio/webm"|".avi"|"video/x-msvideo"|".mov"|"video/quicktime"|".mpeg"|"video/mpeg"|".mp4"|"video/mp4"|"video/3gpp"|"video/3gpp2"|"video/webm"|"video/x-wav"|".md"|"text/markdown"|".xls"|"application/vnd.ms-excel"|".pdf"|"application/pdf"|".txt"|"text/plain"|".doc"|"application/msword"|".docx"|"application/vnd.openxmlformats-officedocument.wordprocessingml.document"|".xlsx"|"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"|".ppt"|"application/vnd.ms-powerpoint"|".pptx"|"application/vnd.openxmlformats-officedocument.presentationml.presentation"|".zip"|"application/zip"|"application/x-zip-compressed"|"multipart/x-zip"|".rar"|"application/vnd.rar"|"application/x-rar-compressed"|".bz"|"application/x-bzip"|".bz2"|"application/x-bzip2"|".gz"|"application/gzip"|"application/x-gzip"} AaFileTypeMime */

class AaFileType {
    /** @enum */
    static Enum={
        UnknownType: 0,
        Jpeg        : 1,
        Png         : 2,
        Gif         : 3,
        Webp        : 4,
        Heic        : 5,
        Ico         : 6,
        Svg         : 7,
        Mp3         : 1000,
        Audio3gpp   : 1001,
        Audio3gpp2  : 1002,
        Aiff        : 1003,
        AudioWebm   : 1004,
        AudioWav    : 1005,
        Avi         : 2000,
        Mov         : 2001,
        Mpeg        : 2002,
        Mp4         : 2003,
        Video3gp    : 2004,
        Video3gp2   : 2005,
        Webm        : 2006,
        Wav         : 2007,
        Pdf         : 3001,
        Txt         : 3002,
        Md          : 3003,
        Doc         : 3004,
        Docx        : 3005,
        Xls         : 3006,
        Xlsx        : 3007,
        Ppt         : 3008,
        Pptx        : 3009,
        Zip         : 7000,
        Rar         : 7001,
        Bzip        : 7002,
        Bzip2       : 7003,
        Gzip        : 7004,
        Json        : 10000,
    }
    static Mimes = {
        Compressed : {
            Bzip        : [".bz", "application/x-bzip"],
            Bzip2       : [".bz2", "application/x-bzip2"],
            Gzip        : [".gz", "application/gzip", "application/x-gzip"],
            Rar         : [".rar", "application/vnd.rar", "application/x-rar-compressed"],
            Zip         : [".zip", "application/zip", "application/x-zip-compressed", "multipart/x-zip"],
        },
        Data : {
            Json        : [".json", "application/json"],
        },
        Image : {
            Gif         : [".gif", "image/gif"],
            Heic        : [".heic", "image/heic", ".heif", ".avci", "image/heif"],
            Ico         : [".ico", "image/vnd.microsoft.icon", "image/x-icon"],
            Jpeg        : [".jpg", "image/jpeg", ".jpeg"],
            Png         : [".png", "image/png"],
            Svg         : [".svg", "image/svg+xml"],
            Webp        : [".webp", "image/webp"],
        },
        Audio : {
            Aiff        : [".aiff", "audio/aiff", ".aif", ".aifc", "audio/x-aiff"],
            Audio3gpp   : [".3gp", "audio/3gpp"],
            Audio3gpp2  : [".3g2", "audio/3gpp2"],
            AudioWav    : [".webm", "audio/webm"],
            AudioWebm   : [".wav", "audio/wav"],
            Mp3         : [".mp3", "audio/mpeg", "audio/mp3"],
        },
        Video : {
            Avi         : [".avi", "video/x-msvideo"],
            Mov         : [".mov", "video/quicktime"],
            Mp4         : [".mp4", "video/mp4"],
            Mpeg        : [".mpeg", "video/mpeg"],
            Video3gp    : [".3gp", "video/3gpp"],
            Video3gp2   : [".3g2", "video/3gpp2"],
            Wav         : [".wav", "video/x-wav"],
            Webm        : [".webm", "video/webm"],
        },
        Document : {
            Doc         : [".doc", "application/msword"],
            Docx        : [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
            Md          : [".md", "text/markdown"],
            Pdf         : [".pdf", "application/pdf"],
            Ppt         : [".ppt", "application/vnd.ms-powerpoint"],
            Pptx        : [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
            Txt         : [".txt", "text/plain"],
            Xls         : [".xls", "application/vnd.ms-excel"],
            Xlsx        : [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        },
    }
    contentType
    ext
    mimeType
    value

    /**
     * @param {AaFileTypeMime|number} mime
     */
    constructor(mime){
		this.value = AaFileType.Enum.UnknownType
		for(const [type, cv] of Object.entries(AaFileType.Mimes)){
			for(const [v,mimes] of Object.entries(cv)){
				 if(mime ===  AaFileType[v] || mimes.includes(mime)){
					this.contentType = mimes[1]
					this.ext = mimes[0]
					this.mimeType = type
					this.value = AaFileType[v]
					return
				}
			}
		}
    }
    isAudio(){return this.mimeType === "Audio"}
    isVideo(){return this.mimeType === "Video"}
    isDocument(){return this.mimeType === "Document"}
    isCompressed(){return this.mimeType === "Compressed"}
    isData(){return this.mimeType === "Data"}
    isImage(){return this.mimeType === "Image"}
    toJSON(){return this.value}
    valueOf(){return this.value}
}
