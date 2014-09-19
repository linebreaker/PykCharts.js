PykCharts.oneD.funnel = function (options) {
    var that = this;
    var theme = new PykCharts.Configuration.Theme({});

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        //1.3 Assign Global variable var that to access function and variable throughout
        that = new PykCharts.oneD.processInputs(that, options);

        var optional = options.optional
        , functionality = theme.oneDimensionalCharts;
        that.rect_width =  options.funnel_rectWidth && _.isNumber(options.funnel_rectWidth)  ? options.funnel_rectWidth : functionality.funnel_rectWidth;
        that.rect_height = options.funnel_rectHeight && _.isNumber(options.funnel_rectHeight) ? options.funnel_rectHeight : functionality.funnel_rectHeight;

        if(that.mode === "default") {
           that.k.loading();
        }

        d3.json(options.data, function (e,data) {
            that.data = data.groupBy("oned");
            that.compare_data = data.groupBy("oned"); 
            $(options.selector+" #chart-loader").remove();
            that.clubData_enable = that.data.length>that.clubData_maximumNodes ? that.clubData_enable : "no";
            that.render();
        });
        // that.clubData.enable = that.data.length>that.clubData.maximumNodes ? that.clubData.enable : "no";

    };


    //----------------------------------------------------------------------------------------
    //2. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.refresh = function () {
        d3.json (options.data, function (e,data) {
            that.data = data.groupBy("oned");
            that.refresh_data = data.groupBy("oned");
            var compare = that.k.checkChangeInData(that.refresh_data,that.compare_data);
            that.compare_data = compare[0];
            var data_changed = compare[1];
            if(data_changed) {
                that.k.lastUpdatedAt("liveData");
            }
            that.optionalFeatures()
                    .clubData()
                    .createChart()
                    .label()
                    .ticks();
        });
    };

    this.render = function () {
        var that = this;
        that.fillChart = new PykCharts.oneD.fillChart(that);
        that.onHoverEffect = new PykCharts.oneD.mouseEvent(that);
        that.transitions = new PykCharts.Configuration.transition(that);
//        theme.stylesheet.borderBetweenChartElements;
        that.border = new PykCharts.Configuration.border(that);
        if(that.mode === "default") {
            that.k.title()
                .subtitle();
        }
        that.k.tooltip();
        that.mouseEvent = new PykCharts.Configuration.mouseEvent(that);
        if(that.mode === "infographics") {

            that.new_data = that.data;
        }
        if(that.mode === "default") {
            that.optionalFeatures()
                .clubData();
        }
        that.optionalFeatures().svgContainer()
            .createChart()
            .label();
        if(that.mode === "default") {
            that.optionalFeatures().ticks();
            that.k.liveData(that)
                .createFooter()
                .lastUpdatedAt()
                .credits()
                .dataSource();
        }
    };

    this.funnelLayout = function (){
        var that = this;
        var data,
            size,
            mouth,
            coordinates;

        var funnel = {
            data: function(d){
                if (d.length===0){

                } else {
                    data = d;
                }
                return this;
            },
            size: function(s){
                if (s.length!==2){

                } else {
                    size = s;
                }
                return this;
            },
            mouth: function(m){
                if (m.length!==2){

                } else {
                    mouth = m;
                }
                return this;
            },
            coordinates: function(){
                var w = size[0];
                var h = size[1];
                var rw = mouth[0]; //rect width
                var rh = mouth[1]; //rect height
                var tw = (w - rw)/2; //triangle width
                var th = h - rh; //triangle height
                var height1=0;
                var height2=0;
                var height3=0;
                var merge = 0;
                var coordinates = [];
                var percentValues = that.percentageValues(data);
                var ratio = tw/th;
                var area_of_trapezium = (w + rw) / 2 * th;
                var area_of_rectangle = rw * rh;
                var total_area = area_of_trapezium + area_of_rectangle;
                var percent_of_rectangle = area_of_rectangle / total_area * 100;
                function d3Sum (i) {
                    return d3.sum(percentValues,function (d, j){
                        if (j>=i) {
                            return d;
                        }
                    });
                }
                for (var i=data.length-1; i>=0; i--){
                    var selectedPercentValues = d3Sum(i);
                    if (percent_of_rectangle>=selectedPercentValues){
                        height3 = selectedPercentValues / percent_of_rectangle * rh;
                        height1 = h - height3;
                        if (i===data.length-1){
                            coordinates[i] = {"values":[{"x":(w-rw)/2,"y":height1},{"x":(w-rw)/2,"y":h},{"x":((w-rw)/2)+rw,"y":h},{"x":((w-rw)/2)+rw,"y":height1}]};
                        }else{
                            coordinates[i] = {"values":[{"x":(w-rw)/2,"y":height1},coordinates[i+1].values[0],coordinates[i+1].values[3],{"x":((w-rw)/2)+rw,"y":height1}]};
                        }
                    }else{
                        var area_of_element;
                        if(merge===0){
                            area_of_element = (selectedPercentValues - percent_of_rectangle)/100 * area_of_trapezium;
                        }else{
                            area_of_element = selectedPercentValues/100 * area_of_trapezium;
                        }
                        //quadratic equation = (-b +- root(pow(b)-4ac))/2a;
                        var a = 2 * ratio;
                        var b = 2 * rw;
                        var c = 2 * area_of_element;
                        height2 = (-b + Math.sqrt(Math.pow(b,2) - (4 * a * -c))) / (2 * a);
                        height1 = h - height2 - rh;
                        var base = 2*(ratio * height2)+rw;
                        var xwidth = (w-base)/2;
                        if(merge===0){
                            if (i===data.length-1){
                                coordinates[i] = {"values":[{"x":xwidth,"y":height1},{"x":(w-rw)/2,"y":th},{"x":(w-rw)/2,"y":h},{"x":((w-rw)/2)+rw,"y":h},{"x":((w-rw)/2)+rw,"y":th},{"x":base+xwidth,"y":height1}]};
                            }else{
                                coordinates[i] = {"values":[{"x":xwidth,"y":height1},{"x":(w-rw)/2,"y":th},coordinates[i+1].values[0],coordinates[i+1].values[3],{"x":((w-rw)/2)+rw,"y":th},{"x":base+xwidth,"y":height1}]};
                            }
                        }
                        else{
                                var coindex;
                                if(coordinates[i+1].values.length===6){
                                    coindex = 5;
                                }else{
                                    coindex = 3;
                                }
                                coordinates[i] = {"values":[{"x":xwidth,"y":height1},coordinates[i+1].values[0],coordinates[i+1].values[coindex],{"x":base+xwidth,"y":height1}]};
                        }
                        merge = 1;
                    }
                }
                return coordinates;
            }
        };
        return funnel;
    };

    this.percentageValues = function (data){
        var that = this;
        that.sum = d3.sum(data, function (d){
            return d.weight;
        });
        var percentValues = data.map(function (d){
            return d.weight/that.sum*100;
        });
        percentValues.sort(function(a,b){
            return b-a;
        });
        return percentValues;
    };
    this.optionalFeatures = function () {

        var optional = {
            svgContainer :function () {
                $(options.selector).css("background-color",that.bg);

                that.svgContainer = d3.select(options.selector)
                    .append('svg')
                    .attr("width",that.width) //+100 removed
                    .attr("height",that.height)
                    .attr("id","svgcontainer")
                    .attr("class","svgcontainer");

                    that.group = that.svgContainer.append("g")
                        .attr("id","funnel");

                return this;
            },
            createChart: function () {
                that.per_values = that.percentageValues(that.new_data);
                that.funnel = that.funnelLayout()
                                .data(that.new_data)
                                .size([that.width,that.height])
                                .mouth([that.rect_width,that.rect_height]);

                that.coordinates = that.funnel.coordinates();
                var line = d3.svg.line()
                                .interpolate('linear-closed')
                                .x(function(d,i) { return d.x; })
                                .y(function(d,i) { return d.y; });

                that.chart_data = that.group.selectAll('.fun-path')
                                .data(that.coordinates);
                var a = [{x:0,y:0},{x:that.width,y:0},{x:0,y:0},{x:that.width,y:0},{x:0,y:0},{x:that.width,y:0}];
                that.chart_data.enter()
                    .append('path')
                    .attr("class", "fun-path")

                that.chart_data
                    .attr("class","fun-path")
                    .attr('d',function(d){ return line(a); })

                   	.attr("fill",function (d,i) {
                        return that.fillChart.chartColor(that.new_data[i]);
        			})
                    .attr("stroke",that.border.color())
                    .attr("stroke-width",that.border.width())
                    .attr("stroke-dasharray", that.border.style())
                    .attr("stroke-opacity",1)
        			.on("mouseover", function (d,i) {
                        that.onHoverEffect.highlight(options.selector +" "+".fun-path",this);
                        tooltip = that.new_data[i].tooltip || "<table class='PykCharts'><tr><th colspan='3' class='tooltip-heading'>"+that.new_data[i].name+"</tr><tr><td class='tooltip-left-content'>"+that.k.appendUnits(that.new_data[i].weight)+"<td class='tooltip-right-content'>(&nbsp; "+that.per_values[i].toFixed(2)+"%&nbsp) </tr></table>";
            			that.mouseEvent.tooltipPosition(d);
                        that.mouseEvent.toolTextShow(tooltip);
        			})
        			.on("mouseout", function (d) {
                        that.onHoverEffect.highlightHide(options.selector +" "+".fun-path");
            			that.mouseEvent.tooltipHide(d);
        			})
        			.on("mousemove", function (d,i) {
                        that.mouseEvent.tooltipPosition(d);
        			})
                    .transition()
                    .duration(that.transitions.duration())
                    .attr('d',function(d){ return line(d.values); });

               that.chart_data.exit()
                   .remove();

                return this;
            },
            label : function () {

                that.chart_text = that.group.selectAll("text")
                    .data(that.coordinates)

                    that.chart_text.enter()
                        .append("text")


                    that.chart_text.attr("y",function (d,i) {
                            if(d.values.length===4){
                                return (((d.values[0].y-d.values[1].y)/2)+d.values[1].y) + 5;
                            } else {
                                return (((d.values[0].y-d.values[2].y)/2)+d.values[2].y) + 5;
                            }
                        })
                        .attr("x", function (d,i) { return that.width/2;})

                    that.chart_text.text("");

                    setTimeout(function(){
                        that.chart_text.text(function (d,i) {
                                return that.k.appendUnits(that.new_data[i].weight);
                             })
                            .attr("text-anchor","middle")
                            .attr("pointer-events","none")
                            .style("font-weight", that.label_weight)
                            .style("font-size", that.label_size)
                            .attr("fill", that.label_color)
                            .style("font-family", that.label_family)
                            .text(function (d,i) {
                                if(this.getBBox().width<(d.values[3].x - d.values[1].x) && this.getBBox().height < (d.values[2].y - d.values[0].y)) {

                                    return that.k.appendUnits(that.new_data[i].weight);
                                }
                                else {
                                    return "";
                                }
                            });
                    },that.transitions.duration());

                    that.chart_text.exit()
                         .remove();
                return this;
            },
            ticks : function () {
                // console.log("ticks");
                if(PykCharts.boolean(that.overflowTicks)) {
                    that.svgContainer.style("overflow","visible");
                }
                    
                var w =[];
                    var tick_label = that.group.selectAll(".ticks_label")
                                        .data(that.coordinates);

                    tick_label.attr("class","ticks_label");

                    tick_label.enter()
                        .append("text")
                        .attr("x",0)
                        .attr("y",0);

                    var x,y;

                    tick_label.attr("transform",function (d) {
                        if (d.values.length === 4) {
                            x = ((d.values[3].x + d.values[2].x)/2 ) + 10;
                            y = ((d.values[0].y + d.values[2].y)/2) + 5;
                        } else {
                            x = (d.values[4].x) + 10;
                            y = (d.values[4].y) + 5;
                        }
                        return "translate(" + x + "," + y + ")";});

                    tick_label.text("");
                        // .transition()
                        // .delay(that.transitions.duration())

                    setTimeout(function() {
                        tick_label.text(function (d,i) { return that.new_data[i].name; })
                            .text(function (d,i) {
                                w[i] = this.getBBox().height;
                                if (this.getBBox().height < (d.values[2].y - d.values[0].y)) {
                                    return that.new_data[i].name;
                                }
                                else {
                                    return "";
                                }
                            })
                            .attr("font-size", that.ticks_size)
                            .attr("text-anchor","start")
                            .attr("fill", that.ticks_color)
                            .attr("pointer-events","none")
                            .attr("font-family", that.ticks_family);
                    },that.transitions.duration());

                    tick_label.exit().remove();
                    var tick_line = that.group.selectAll(".funnel-ticks")
                        .data(that.coordinates);

                    tick_line.enter()
                        .append("line")
                        .attr("class", "funnel-ticks");

                    tick_line
                        .attr("x1", function (d,i) {
                           if (d.values.length === 4) {
                                return ((d.values[3].x + d.values[2].x)/2 );
                           } else {
                                return (d.values[4].x);
                           }

                        })
                        .attr("y1", function (d,i) {
                            if (d.values.length === 4) {
                                return ((d.values[0].y + d.values[2].y)/2);
                           } else {
                                return (d.values[4].y);
                           }
                        })
                        .attr("x2", function (d, i) {
                            if (d.values.length === 4) {
                                return ((d.values[3].x + d.values[2].x)/2 );
                           } else {
                                return (d.values[4].x);
                           }
                        })
                        .attr("y2", function (d, i) {
                            if (d.values.length === 4) {
                                return ((d.values[0].y + d.values[2].y)/2);
                           } else {
                                return (d.values[4].y);
                           }
                        })
                        .attr("stroke-width", that.ticks_thickness)
                        .attr("stroke", that.ticks_color)
                        // .transition()
                        // .duration(that.transitions.duration())

                        setTimeout(function(){
                            tick_line.attr("x2", function (d, i) {
                                if(( d.values[2].y - d.values[0].y) > w[i]) {
                                    if (d.values.length === 4) {
                                        return ((d.values[3].x + d.values[2].x)/2 ) + 5;
                                    } else {
                                        return ((d.values[4].x) +5);
                                    }
                                } else {
                                    if (d.values.length === 4) {
                                        return ((d.values[3].x + d.values[2].x)/2 );
                                    } else {
                                        return (d.values[4].x);
                                    }
                                }
                            });
                        },that.transitions.duration());

                    tick_line.exit().remove();

                return this;
            },
            clubData : function () {
                if(PykCharts.boolean(that.clubData_enable)) {
                    var clubdata_content = [];
                    if(that.clubData_alwaysIncludeDataPoints.length!== 0){
                        var l = that.clubData_alwaysIncludeDataPoints.length;
                        for(i=0; i < l; i++){
                            clubdata_content[i] = that.clubData_alwaysIncludeDataPoints[i];
                        }
                    }
                    var newData = [];
                    for(i=0;i<clubdata_content.length;i++){
                        for(j=0;j<that.data.length;j++){
                            if(clubdata_content[i].toUpperCase() === that.data[j].name.toUpperCase()){
                                newData.push(that.data[j]);
                            }
                        }
                    }
                    that.data.sort(function (a,b) { return b.weight - a.weight; });
                    var k = 0;
                    while(newData.length<that.clubData_maximumNodes-1){
                        for(i=0;i<clubdata_content.length;i++){
                            if(that.data[k].name.toUpperCase() === clubdata_content[i].toUpperCase()){
                                k++;
                            }
                        }
                        newData.push(that.data[k]);
                        k++;
                    }
                    var sum_others = 0;
                    for(j=k; j < that.data.length; j++){
                        for(i=0; i<newData.length && j<that.data.length; i++){
                            if(that.data[j].name.toUpperCase() === newData[i].name.toUpperCase()){
                                sum_others +=0;
                                j++;
                                i = -1;
                            }
                        }
                        if(j < that.data.length){
                            sum_others += that.data[j].weight;
                        }
                    }
                    var sortfunc = function (a,b) { return b.weight - a.weight; };
                    while(newData.length > that.clubData_maximumNodes){
                        newData.sort(sortfunc);
                        var a=newData.pop();
                    }

                    var others_Slice = { "name":that.clubData_text, "weight": sum_others, "color": that.clubData_color, "tooltip": (that.clubData_tooltip)};
                    if(newData.length < that.clubData_maximumNodes){
                        newData.push(others_Slice);
                    }
                    newData.sort(function (a,b) { return b.weight - a.weight; });
                    that.new_data = newData;
                }
                else {
                    that.data.sort(function (a,b) { return b.weight - a.weight; });
                    that.new_data = that.data;
                }
                return this;
            }
        };
        return optional;
    };
};
