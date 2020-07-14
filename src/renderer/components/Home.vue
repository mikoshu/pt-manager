<template>
  <div class="page-home">
    <!-- <div class="top-bar">
      
    </div> -->
    <el-alert
      :title="`当前目录: [${dir}]`"
      type="warning"
      class="fixed"
      :closable="false">
    </el-alert>
    
    <div class="content">
      <div class="header">
        <el-row>
          <el-col :span="20">
            <h3>
              在当前目录导入工程
            </h3>
          </el-col>
          <el-col :span="4">
            <el-button class="right" type="primary" icon="el-icon-upload" size="mini" @click="openConfig()">新增</el-button>
          </el-col>
        </el-row>
      </div>
      <ul class="template clearfix" v-if="list.length > 0">
        <li v-for="(val , i) in list" :key="i" @click="useTemplate(val.name, val.key, val.ignore)">
          <el-card class="box-card" shadow="always">
            <div slot="header" class="clearfix">
              <span>
                <i class="el-icon-folder-opened"></i>
                {{val.name}}
              </span>
              <i class="el-icon-delete-solid icon-remove" @click.stop="deleteTemplate(val.name, i, val.key)"></i>
              <i class="el-icon-s-tools icon-set" @click.stop="openConfig(val)" ></i>
            </div>
            <div>
              <p>{{val.desc}}</p>
            </div>
          </el-card>
        </li>
      </ul>
      <div class="no-data" v-if="list.length == 0">
        <dl>
          <dd class="el-icon-folder-add"></dd>
          <dt>
            暂无模板内容，点击<a href="javascript:;" @click="openConfig()" >添加</a>新增工程模板
          </dt>
        </dl>
      </div>
    </div>


    <!-- 配置弹窗 -->
    <el-dialog
      :title="title"
      :visible.sync="configDialog"
      width="400px"
    >
      <el-form ref="form" :model="form" label-width="90px">
        <el-form-item label="模板名称">
          <el-input size="mini" v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input size="mini"  v-model="form.desc"></el-input>
        </el-form-item>
        <el-form-item label="选择目录" v-if="!edit">
          <el-input style="margin-top: 7px;" size="mini"  v-model="form.src">
            <el-button slot="append" icon="el-icon-folder-opened" @click="openFolder" ></el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="ignore规则">
          <el-input size="mini"  v-model="form.ignore"></el-input>
          <p class="tip">逗号分隔，文件路径包含ignore内容将不被导入，(默认忽略包含node_modules和.git路径文件)</p>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="configDialog = false">取 消</el-button>
        <el-button size="mini" type="primary" @click="createTemplate">确 定</el-button>
      </span>
    </el-dialog>
    
  </div>
</template>

<script>
// @ is an alias to /src
import fs from 'fs-extra'
import {ipcRenderer} from 'electron'
import path from 'path'


export default {
  name: 'Home',
  data(){
    return {
      title: '新增模板',
      edit: false,
      form:{
        name: '',
        desc: '',
        src: '',
        ignore: 'node_modules,.git'
      },
      rules: {
        name: '请填写模板名称',
        desc: '请填写模板描述',
        src: '请选择模板目录'
      },
      configDialog: false,
      dir: '',
      list: []
    }
  },
  mounted(){
    // console.log(fs)
    this.reloadList()
    ipcRenderer.on('selectedItem',this.getPath);
    ipcRenderer.send('getPath','');
    ipcRenderer.on('setPath',this.setPath);
    
  },
  methods: {
    setPath(e,path){
      if(!path){
        this.dir = process.cwd()
      }else{
        this.dir = path
      }
    },
    reloadList(){ // 更新模板列表
      let jsonSrc = path.join(__dirname,'/CONFIG.json')
      fs.ensureFileSync(jsonSrc)
      try{
        let json = fs.readJsonSync(jsonSrc)
      }catch(err){
        fs.writeJsonSync(jsonSrc, [])
        this.reloadList()
      }
      
      let json = fs.readJsonSync(jsonSrc)

      this.list = json

    },
    useTemplate(name, key, ignore){
      let loading
      let src = path.join(__dirname, '/TEMPLATES',key)
      this.$confirm(`是否在目录 [${this.dir}] 下导入模板${name}`, '使用模板', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => { // 复制文件
        loading = this.$loading({ // loading
          lock: true,
          text: '模板下载中，请稍候...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        return this.copyFile(src, this.dir, ignore)
      }).then(resp => {
        setTimeout(() => {
          loading.close();
          this.$message.success('模板下载完成！')
        }, 1000);
      }).catch((err) => {
        // console.error(err)        
        this.$message.error(err.message)
      });
    },
    // TODO: 复制文件时忽略ignore问题
    copyFile(src, target, ignore){
      return new Promise((resolve, reject) => {
        const filterFunc = (src, dest) => {
          let ignoreArray = ignore.split(',')
          for(let ig of ignoreArray){
            if(src.indexOf(ig) > -1){
              return false
            }
          }
          return true
        }
        try{
          fs.copySync(src, target, { // 过滤ignore
            filter: filterFunc
          })
          resolve('success')
        } catch(err) {
          reject(err)
        }
      })
    },
    deleteTemplate(name, i, key){
      this.$confirm(`是否删除工程模板${name}`, '删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let jsonSrc = path.join(__dirname,'/CONFIG.json')
        fs.ensureFileSync(jsonSrc)
        let json = fs.readJsonSync(jsonSrc)
        json.splice(i, 1)
        fs.writeJsonSync(jsonSrc, json)
        fs.removeSync(path.join(__dirname, '/TEMPLATES',key))
        this.reloadList()
        this.$message({
          type: 'success',
          message: '删除成功!'
        });
      }).catch((err) => {
        // console.error(err)
        this.$message.error(err.message)
      });
    },
    openConfig(tmp){ // 配置
      if(tmp){
        this.title = '编辑项目模板'
        let {name, src, desc, ignore, key} = tmp
        this.form = {
          name, src, desc, ignore, key
        }
        this.edit = true
      }else{
        this.edit = false
        this.title = '新增项目模板'
        this.form = {
          name: '',
          desc: '',
          src: '',
          ignore: 'node_modules,.git'
        }
      }
      this.configDialog = true
    },
    openFolder(){
      ipcRenderer.send('selectDirectory','openDirectory');
    },
    getPath(e,path){
      if(path === null){
        this.$message.error('请选择一个模板目录')
        return
      }
      this.form.src = path
    },
    getRandomCode(length) { // 生成随机字符串
      if (length > 0) {
        var data = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        var nums = "";
        for (var i = 0; i < length; i++) {
          var r = parseInt(Math.random() * 61);
          nums += data[r];
        }
        return nums;
      } else {
        return false;
      }
    },

    createTemplate(){
      for(let key in this.rules){
        if(this.form[key] == ''){
          this.$message.error(this.rules[key])
          return
        }
      }
      
      let folderName = this.getRandomCode(10)
      let target = path.join(__dirname, '/TEMPLATES',folderName)

      let jsonSrc = path.join(__dirname,'/CONFIG.json')
      fs.ensureFileSync(jsonSrc)
      let json = fs.readJsonSync(jsonSrc)
      let hasTemplate = false  // 判断是否已经存在同名模板
      for(let val of json){
        if(val.name === this.form.name && !this.eidt){
          hasTemplate = true
          this.$alert('该模板名称已存在，请更换模板名称避免模板冲突', '模板已存在', {
            confirmButtonText: '确定',
            callback: action => { }
          });
          return
        }
      }

      if(this.edit){
        let index = json.findIndex(val => val.key === this.form.key)
        json[index] = this.form
        fs.writeJsonSync(jsonSrc, json)
        this.configDialog = false
        this.reloadList()
        this.$message.success('修改成功')
        return
      }

      const loading = this.$loading({ // loading
        lock: true,
        text: '模板拷贝中，请稍候...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      this.copyFile(this.form.src, target, this.form.ignore).then(resp => { // 模板复制成功
        let {name, src, desc, ignore} = this.form
        let opt = {
          name,
          src,
          desc,
          ignore,
          key: folderName
        }
        json.push(opt)
        fs.writeJsonSync(jsonSrc, json)
        this.configDialog = false
        this.reloadList()
        setTimeout(() => {
          loading.close();
          this.$message.success('模板上传成功！')
        }, 1000);
      }).catch(err => {
        // console.error(err)
        this.$message.error(err.message)
        loading.close();
      })
    }
  }
}
</script>

<style lang="scss">

$c-tip: #0099CC; 
$c-danger: #F56C6C;
$c-info: #999;
$c-primary: #409EFF;


.page-home{
  padding-top: 30px;
  .top-bar{
    padding: 0 10px;
    height: 30px;
    background: $c-primary;
    
  }
  .fixed{
    position: fixed;
    left: 0;
    top: 0px;
    width: 100%;
    z-index: 99;
  }
  .right{
    float: right;
  }
  .tip{
    font-size: 12px;
    line-height: 14px;
    color: $c-danger;
  }
  .header{
    margin-top: 5px;
    margin-bottom: 10px;
    height: 30px;
    // background: #f5f5f5;
    h3{
      font-size: 14px;
      line-height: 30px;
      span{
        color: $c-tip;
      }
    }
  }
  .no-data{
    padding-top: 80px;
    text-align: center;
    dd{
      font-size: 80px;
      color: $c-info;
    }
    dt{
      margin-top: 10px;
      font-size: 14px;
      a{
        color:$c-primary;
      }
    }
  }
  .content{
    padding:0 10px 10px;
    font-size: 14px;

    .icon-remove{
      float: right;
      margin-top: 4px;
      color: $c-danger;
    }
    .icon-set{
      float: right;
      margin-top: 4px;
      margin-right: 5px;
      color: $c-info;
    }
    p{
      height: 20px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      color: #999;
    }
    .template{
      
      li{
        float: left;
        margin-bottom: 10px;
        width: 49%;
        &:nth-child(2n){
          margin-left: 2%;
        }
      }
    }
  }
  .el-card{
    cursor: pointer;
  }
  .el-card__header{
    padding: 5px 10px;
    span{
      width: 100%;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
  }
  .el-card__body{
    padding: 10px;
  }
  .el-alert{
    padding: 5px 2px;
  }
  .el-form-item{
    margin-bottom: 0;
  }
  .el-dialog__body{
    padding: 10px 20px;
  }
  .el-dialog__footer{
    padding: 0 20px 10px;
  }

}
</style>
