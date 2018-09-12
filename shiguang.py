import os
import requests
from pyquery import PyQuery as pq
import time


class Model():
    """
    基类, 用来显示类的信息
    """

    def __repr__(self):
        name = self.__class__.__name__
        properties = ('{}=({})'.format(k, v) for k, v in self.__dict__.items())
        s = '\n<{} \n  {}>'.format(name, '\n  '.join(properties))
        return s


class Movie(Model):
    """
    存储电影信息
    """

    def __init__(self):
        self.name = ''
        self.type = ''
        self.quote = ''
        self.cover_url = ''
        self.ranking = 0


def get(url, filename):
    """
    缓存, 避免重复下载网页浪费时间
    """
    folder = 'shiguang'
    # 建立 cached 文件夹
    if not os.path.exists(folder):
        os.makedirs(folder)

    path = os.path.join(folder, filename)

    if os.path.exists(path):
        with open(path, 'rb') as f:
            s = f.read()
            return s
    else:
        # 发送网络请求, 把结果写入到文件夹中
        r = requests.get(url)
        with open(path, 'wb') as f:
            f.write(r.content)
        return r.content


def movie_from_div(li):

    e = pq(li)

    # 小作用域变量用单字符
    m = Movie()
    m.name = e('.px14').text()
    m.type = e('span').text()
    m.quote = e('.mt3').text()
    m.cover_url = e('.mov_pic a img').attr('src')
    m.ranking = e('.number em').text()

    return m


def save_cover(movies):
    for m in movies:
        filename = '{}.jpg'.format(m.ranking)
        get(m.cover_url, filename)


def movies_from_url(url):
    """
    从 url 中下载网页并解析出页面内所有的电影
    """
    filename = '{}'.format(url.split('/')[-1])
    page = get(url, filename)
    e = pq(page)
    items = e('li')
    movies = [movie_from_div(i) for i in items]
    movies = [x for x in movies if x.cover_url != None]  # 去除空的数据
    save_cover(movies)
    return movies


def main():
    start = time.time()
    url = 'http://www.mtime.com/top/movie/top100/index.html'
    movies = movies_from_url(url)
    print('top250 movies', movies)

    for i in range(1, 11):
        url = 'http://www.mtime.com/top/movie/top100/index-{}.html'.format(i)
        movies1 = movies_from_url(url)
        print('top250 movies1', movies1)

    end = time.time()
    print('duration', end - start)


if __name__ == '__main__':
    main()
