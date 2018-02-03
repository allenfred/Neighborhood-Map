var map;
var infoWindow;
var apiUrl = "http://api.nytimes.com/svc/search/v2/articlesearch.json?sort=newest&api-key=0341b498c7814868932a44861c331a9a&q=";
var wikiApiUrl = "";
var filterText = ko.observable("");
// 初始化地图点示例数据
var placesData = [
    {
        title: 'Yosemite Fwy, Fresno',
        position: { lat:   36.729508, lng: -119.78173 }
    },{
        title: 'Black Oaks St, North Las Vegas',
        position: { lat:  36.279675, lng: -115.158784 }
    }, {
        title: 'Los Angeles County, CA',
        position: { lat: 34.052227, lng: -118.24366 }
    }, {
        title: 'Death Valley National Park',
        position: {lat: 36.564061, lng: -117.133126 }
    }, {
        title: 'San Francisco',
        position: { lat:  37.77493, lng: -122.419416 }
    }
];

var Point = function(data){
    var self = this;
    this.title = data.title;
    this.position = data.position;

    // 定义point的可见属性
    this.visible = ko.computed(function(){
        var re = filterText().toLowerCase();
        var placeName = self.title.toLowerCase();
        return (placeName.indexOf(re) > -1);
    });

    // 定义每个point对应的marker对象
    this.marker = new google.maps.Marker({
        position:self.position,
        title:self.title,
        animation:google.maps.Animation.DROP
    });

    // 监听地图上point的点击事件,打开信息窗口
    google.maps.event.addListener(self.marker,'click',function(){
        
        infoWindow.setContent(self.title);
        infoWindow.open(map,self.marker);
        
        // 设置点击产生动画效果
        if(self.marker.getAnimation() != null){
            self.marker.setAnimation(null);
        }else{
            self.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){
                self.marker.setAnimation(null);
            },2000);
        } 

        // ajax请求第三方接口数据
        $.ajax({
            url: apiUrl + self.title,
            type: 'GET',
            crossDomain: true,
            dataType: 'json',
            success: function(data) { 
                var content = self.title;
                // catch异常,当第三方api接口未返回相关信息
                try{
                    content = data.response.docs[0].snippet;
                }catch(e){
                    console.log('当前地点未查询到对应的信息',e);
                }
                infoWindow.setContent(content);
                infoWindow.open(map,self.marker);
            },
            error: function() { 
                alert('纽约时报api调用失败');
            },
        });
    });
}

// 定义侧边栏上的列表对象
var ListModel = function(){
    var self = this;
    this.pointsList = [];

    placesData.forEach(function(point){
        self.pointsList.push(new Point(point));
    });

    // 筛选出符合条件的地点
    this.filteredList = ko.computed(function(){
        var result = [];
        self.pointsList.forEach(function(point){
            if(point.visible()){
                result.push(point);
                point.marker.setMap(map,point.position);
            }else{
                point.marker.setMap(null);
            }
        });
        return result;
    });

    this.listClick = function(place){
        google.maps.event.trigger(place.marker,'click');
    }
}

// 谷歌地图加载成功，回调函数
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: placesData[0].position,
        zoom: 7
    });
    infoWindow = new google.maps.InfoWindow();
    ko.applyBindings(new ListModel());
}

function mapError(){
    alert('谷歌地图加载失败');
}
