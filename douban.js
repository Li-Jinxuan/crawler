const fs = require('fs')
const path = require('path')

const request = require('syncrequest')
const cheerio = require('cheerio')

const log = console.log.bind(console)


class Movie {
    constructor() {
        this.name = ''
        this.score = 0
        this.quote = ''
        this.ranking = 0
        this.coverUrl = ''

    }
}

// 清洗数据的例子
const clean = (movie) => {
    let m = movie
    let o = {
        name: m.name,
        score: m.SCORE,
        quote: m._quote,
        ranking: Number(m.ranking),
        coverUrl: m.cover_url,
    }
    return o
}

const movieFromDiv = (div) => {
    let e = cheerio.load(div)

    // 创建一个电影类的实例并且获取数据
    // 这些数据都是从 html 结构里面人工分析出来的
    let movie = new Movie()
    movie.name = e('.title').text()
    movie.score = Number(e('.rating_num').text())
    movie.quote = e('.inq').text()

    let pic = e('.pic')
    movie.ranking = Number(pic.find('em').text())
    movie.coverUrl = pic.find('img').attr('src')

    let other = e('.other').text()
    movie.otherNames = other.slice(3)

    return movie
}

const ensureDir = (dir) => {
    let exists = fs.existsSync(dir)
    if (!exists) {
        fs.mkdirSync(dir)
    }
}

const cachedUrl = (url) => {
    let dir = 'cached_html'
    ensureDir(dir)
    // 1. 确定缓存的文件名
    // let cacheFile = dir + '/' + url.split('?')[1] + '.html'
    let filename = url.split('?')[1] + '.html'
    // 用 path.join 来拼接可以运行在各个操作系统上
    // 不要手动拼接路径
    let cacheFile = path.join(dir, filename)
    log('cacheFile', cacheFile)
    // 2. 检查缓存文件是否存在
    // 如果存在就读取缓存文件
    // 如果不存在就下载并且写入缓存文件
    let exists = fs.existsSync(cacheFile)
    if (exists) {
        let s = fs.readFileSync(cacheFile)
        return s
    } else {
        // 用 GET 方法获取 url 链接的内容
        // 相当于在浏览器地址栏输入 url 按回车后得到的 HTML 内容
        let r = request.get.sync(url)
        // utf-8 是网页文件的文本编码
        let body = r.body
        // 写入缓存
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

const moviesFromUrl = (url) => {
    let body = cachedUrl(url)
    // cheerio.load 用来把 HTML 文本解析为一个可以操作的 DOM
    // 这样就可以使用 DOM API
    let e = cheerio.load(body)

    // 一共有 25 个 .item
    let movieDivs = e('.item')
    // 循环处理 25 个 .item
    let movies = []
    for (let i = 0; i < movieDivs.length; i++) {
        let div = movieDivs[i]
        // 扔给 movieFromDiv 函数来获取到一个 movie 对象
        let m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

const saveMovie = (movies) => {
    // JSON.stringify 第 2 3 个参数配合起来是为了让生成的 json
    // 数据带有缩进的格式，第三个参数表示缩进的空格数
    let s = JSON.stringify(movies, null, 2)
    // 把 json 格式字符串写入到 文件 中
    let path = 'douban.json'
    fs.writeFileSync(path, s)
}

const downloadCovers = (movies) => {
    let dir = 'covers'
    ensureDir(dir)
    for (let i = 0; i < movies.length; i++) {
        let m = movies[i]
        let url = m.coverUrl
        let name = String(m.ranking) + '_' + m.name.split('/')[0] + '.jpg'
        let cover = path.join(dir, name)
        request.sync(url, {
            pipe: cover,
        })
    }
}

const __main = () => {
    // 主函数
    // let url = 'https://movie.douban.com/top250'
    let movies = []
    for (let i = 0; i < 10; i++) {
        let start = i * 25
        let url = `https://movie.douban.com/top250?start=${start}&filter=`
        let moviesInPage = moviesFromUrl(url)
        // es6 的 spread operator
        movies = [...movies, ...moviesInPage]
        // 常规写法
        // movies = movies.concat(moviesInPage)
    }
    log('movies', movies.length)
    saveMovie(movies)
    downloadCovers(movies)
    // let movies = moviesFromUrl(url)
    // saveMovie(movies)
    log('抓取成功, 数据已经写入到 douban.json 中')
}

__main()
