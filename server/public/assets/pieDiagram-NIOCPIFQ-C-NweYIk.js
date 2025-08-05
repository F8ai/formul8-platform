import{p as U}from"./chunk-353BL4L5-BvPe82jk.js";import{bf as S,b7 as z,ck as Z,aZ as j,aJ as q,aK as J,au as K,av as Q,ax as H,aw as X,as as p,aF as F,aQ as Y,ay as tt,a_ as et,b2 as at,bq as rt,aG as nt}from"./index-B8YngC3q.js";import{p as it}from"./treemap-75Q7IDZK-Cv9Rkbnu.js";import{d as P}from"./arc-D2n5C59m.js";import{o as st}from"./ordinal-DILIJJjt.js";import"./_baseUniq-DBB3sNMy.js";import"./_basePickBy-DXUbbSBd.js";import"./clone-BBc2jqr_.js";import"./init-Dmth1JHB.js";function ot(t,a){return a<t?-1:a>t?1:a>=t?0:NaN}function lt(t){return t}function ct(){var t=lt,a=ot,m=null,o=S(0),g=S(z),x=S(0);function i(e){var r,l=(e=Z(e)).length,c,w,h=0,u=new Array(l),n=new Array(l),v=+o.apply(this,arguments),A=Math.min(z,Math.max(-z,g.apply(this,arguments)-v)),f,T=Math.min(Math.abs(A)/l,x.apply(this,arguments)),$=T*(A<0?-1:1),d;for(r=0;r<l;++r)(d=n[u[r]=r]=+t(e[r],r,e))>0&&(h+=d);for(a!=null?u.sort(function(y,C){return a(n[y],n[C])}):m!=null&&u.sort(function(y,C){return m(e[y],e[C])}),r=0,w=h?(A-l*$)/h:0;r<l;++r,v=f)c=u[r],d=n[c],f=v+(d>0?d*w:0)+$,n[c]={data:e[c],index:r,value:d,startAngle:v,endAngle:f,padAngle:T};return n}return i.value=function(e){return arguments.length?(t=typeof e=="function"?e:S(+e),i):t},i.sortValues=function(e){return arguments.length?(a=e,m=null,i):a},i.sort=function(e){return arguments.length?(m=e,a=null,i):m},i.startAngle=function(e){return arguments.length?(o=typeof e=="function"?e:S(+e),i):o},i.endAngle=function(e){return arguments.length?(g=typeof e=="function"?e:S(+e),i):g},i.padAngle=function(e){return arguments.length?(x=typeof e=="function"?e:S(+e),i):x},i}var R=j.pie,G={sections:new Map,showData:!1,config:R},E=G.sections,W=G.showData,ut=structuredClone(R),pt=p(()=>structuredClone(ut),"getConfig"),gt=p(()=>{E=new Map,W=G.showData,Y()},"clear"),dt=p(({label:t,value:a})=>{E.has(t)||(E.set(t,a),F.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),ft=p(()=>E,"getSections"),mt=p(t=>{W=t},"setShowData"),ht=p(()=>W,"getShowData"),I={getConfig:pt,clear:gt,setDiagramTitle:q,getDiagramTitle:J,setAccTitle:K,getAccTitle:Q,setAccDescription:H,getAccDescription:X,addSection:dt,getSections:ft,setShowData:mt,getShowData:ht},vt=p((t,a)=>{U(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),yt={parse:p(async t=>{const a=await it("pie",t);F.debug(a),vt(a,I)},"parse")},St=p(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,"getStyles"),xt=St,wt=p(t=>{const a=[...t.entries()].map(o=>({label:o[0],value:o[1]})).sort((o,g)=>g.value-o.value);return ct().value(o=>o.value)(a)},"createPieArcs"),At=p((t,a,m,o)=>{F.debug(`rendering pie chart
`+t);const g=o.db,x=tt(),i=et(g.getConfig(),x.pie),e=40,r=18,l=4,c=450,w=c,h=at(a),u=h.append("g");u.attr("transform","translate("+w/2+","+c/2+")");const{themeVariables:n}=x;let[v]=rt(n.pieOuterStrokeWidth);v??(v=2);const A=i.textPosition,f=Math.min(w,c)/2-e,T=P().innerRadius(0).outerRadius(f),$=P().innerRadius(f*A).outerRadius(f*A);u.append("circle").attr("cx",0).attr("cy",0).attr("r",f+v/2).attr("class","pieOuterCircle");const d=g.getSections(),y=wt(d),C=[n.pie1,n.pie2,n.pie3,n.pie4,n.pie5,n.pie6,n.pie7,n.pie8,n.pie9,n.pie10,n.pie11,n.pie12],D=st(C);u.selectAll("mySlices").data(y).enter().append("path").attr("d",T).attr("fill",s=>D(s.data.label)).attr("class","pieCircle");let N=0;d.forEach(s=>{N+=s}),u.selectAll("mySlices").data(y).enter().append("text").text(s=>(s.data.value/N*100).toFixed(0)+"%").attr("transform",s=>"translate("+$.centroid(s)+")").style("text-anchor","middle").attr("class","slice"),u.append("text").text(g.getDiagramTitle()).attr("x",0).attr("y",-(c-50)/2).attr("class","pieTitleText");const M=u.selectAll(".legend").data(D.domain()).enter().append("g").attr("class","legend").attr("transform",(s,b)=>{const k=r+l,_=k*D.domain().length/2,B=12*r,V=b*k-_;return"translate("+B+","+V+")"});M.append("rect").attr("width",r).attr("height",r).style("fill",D).style("stroke",D),M.data(y).append("text").attr("x",r+l).attr("y",r-l).text(s=>{const{label:b,value:k}=s.data;return g.getShowData()?`${b} [${k}]`:b});const L=Math.max(...M.selectAll("text").nodes().map(s=>(s==null?void 0:s.getBoundingClientRect().width)??0)),O=w+e+r+l+L;h.attr("viewBox",`0 0 ${O} ${c}`),nt(h,c,O,i.useMaxWidth)},"draw"),Ct={draw:At},Gt={parser:yt,db:I,renderer:Ct,styles:xt};export{Gt as diagram};
