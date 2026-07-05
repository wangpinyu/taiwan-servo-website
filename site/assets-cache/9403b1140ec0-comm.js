(function () {
  "use strict";  
  document.addEventListener('DOMContentLoaded', function () {
    var webRoot = typeof web_root === 'undefined' ? '' : web_root,
        win = window,
        winInner = 0,
        body = document.body,
        header = document.getElementById('header'),
        navBtn = document.getElementById('nav-btn'),
        mainNav = header.querySelector('.main-nav'),
        mobileSide = header.querySelector('.mobile-side'),
        navWrap = document.querySelectorAll('.nav-wrap'),
        maskBg = document.getElementById('mask-bg'),
        footer = document.getElementById('footer'),
        floatBtn = document.querySelector('.float-btn'),
        goTop = document.querySelector('.gotop'),
        tgBtns = document.querySelectorAll('.tg-btn'),
        dynNodes = document.querySelectorAll('.dyn-node'),
        tbJs = document.querySelectorAll('.tb-js'),
        pageWidth = 0,
        brokenWidth = 1200;

    //移動物件
    function moveNode() {
        var parentNodeClass = winInner >= brokenWidth ? '.node-pc' : '.node-mobile';
        dynNodes.forEach(function (dynNode) {
          var selfNode = dynNode.getAttribute('data-node');
          var parent = document.querySelector(`${parentNodeClass}[data-child="${selfNode}"]`);
          if (parent && !dynNode.parentElement.classList.contains(parentNodeClass)) {
            parent.appendChild(dynNode);
          }
        });
    }

    // 主選單開合
    function openNav() {
        navBtn.classList.add('on');
        if (!body.classList.contains('lock')) {
            body.classList.add('lock');
            maskBg.classList.add('on');
        }
        mobileSide.classList.add('on');
    }
    function closeNav() {
        navBtn.classList.remove('on');
        mainNav.querySelectorAll('li').forEach(function (element) {
            if (element.dataset.currentOn === 'true') {
                element.classList.add('on');
            }
            element.classList.remove('on');
        });
        mobileSide.classList.remove('on');
        maskBg.classList.remove('on');
        body.classList.remove('lock');
    }
    function checknavBtn() {
        var NavOn = header.querySelector('.mobile-side.on');
        if (NavOn && winInner >= brokenWidth){
            closeNav();
        }
    }
    navBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (pageWidth <= brokenWidth) {
            var isOpen = navBtn.classList.contains('on');
            if (isOpen) {
                closeNav();
            } else {
                openNav();
            }
        }
    });
    maskBg.addEventListener('click', closeNav);

    // 核對開合物件
    function findContainer(element, tgData) {
        var targetEl = element.parentNode;
        while (targetEl) {
            if (targetEl.classList.contains(tgData)) {
                return targetEl;
            }
            targetEl = targetEl.parentNode;
        }
        return null;
    };

    // 開合容器的click
    function tgBtnClink(tgBtn) {
        tgBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var tgData = tgBtn.getAttribute('data-target');
            var tgMom = findContainer(tgBtn, tgData);
            console.log(tgMom);
            tgBtn.classList.toggle('on');
            if (tgMom) {
                tgMom.classList.toggle('on');
            }
        });
    }

    // 添加多層選單樣式
    function addHasNav(element) {
        var navLi = element.querySelectorAll('li');
        navLi.forEach(function (li) {
            if (li.querySelector('ul')) {
                li.classList.add('has-nav');
            }
    
            if (li.classList.contains('on')) {
                li.dataset.currentOn = true;
            }
        });

        navLi.forEach(function (onItem) {
            if (onItem.classList.contains('on')) {
                onItem.dataset.currentOn = true;
            }
        });
    }

    navWrap.forEach(addHasNav);
    tgBtns.forEach(tgBtnClink);    
      
    // 表格變化
    if (tbJs.length) {
        tbJs.forEach(function (table) {
            var th = table.querySelectorAll('th');
            var td = table.querySelectorAll('td');

            function setAttr(element) {
                var idx = Array.from(element.parentNode.children).indexOf(element);
                var text = th[idx].textContent;
                element.setAttribute('data-txt', text);
            }

            td.forEach(function (element) {
                setAttr(element);
            });
        });
    };

    // 回頂端事件
    function floatBtnWrap(p0) {
        floatBtn.classList.toggle('end', p0 >= footer.offsetTop);
    }
    goTop.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // 平滑滚动
        });
    });      
    
    // 卷軸事件-header.fix, gotop 
    win.addEventListener('scroll', function () {
        var scroll = win.scrollY;
        var top = header.offsetHeight;
        var winH = win.innerHeight;
    
        floatBtn.classList.toggle('block', scroll > top);
        header.classList.toggle('fix', scroll > top);
    
        floatBtnWrap(winH + scroll);
    });
    win.dispatchEvent(new Event('scroll'));

    // 視窗寬度變動 讀入
    function widthChange() {
        var newWidth = win.innerWidth;
        return newWidth !== winInner;
    }
    function preRwd() {
        if (widthChange()) {
            winInner = win.innerWidth; // 更新寬度
            moveNode();
            checknavBtn();
        }
    }
    win.addEventListener('resize', preRwd);
    win.addEventListener('load', preRwd);
    preRwd();

  });
})();
