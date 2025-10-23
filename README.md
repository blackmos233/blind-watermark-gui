## 🖼️ Blind Watermark GUI

一个基于 [blind_watermark](https://github.com/guofei9987/blind_watermark) 的图形化网页工具，用于轻松地给图片添加或提取盲水印。
无需命令行操作，只需上传图片，一键完成水印嵌入与提取。

---

### ✨ 功能特色

* 图形化界面，无需命令行
* 支持图片盲水印的**嵌入**与**提取**
* 支持拖拽上传与实时预览
* 核心算法基于开源库 [`blind_watermark`](https://github.com/guofei9987/blind_watermark)

---

### 🚀 使用说明

#### 安装：

```bash
git clone https://github.com/blackmos233/blind-watermark-gui.git
cd blind-watermark-gui
pip install -r requirements.txt
python app.py
```

#### 使用：

* 启动成功后，访问控制台提示的地址（默认端口为 `5000`）
* 如需修改端口或配置，可直接编辑 `app.py`

---

### 🧠 技术栈

* 后端：Python + Flask
* 核心算法：`blind_watermark`

---

### 📜 致谢

* [guofei9987/blind_watermark](https://github.com/guofei9987/blind_watermark) — 核心盲水印算法库
* 感谢 Gemini 和其他所有 AI 的帮助

---

### 📄 开源协议

本项目遵循 [MIT License](LICENSE)。
在使用时请保留原项目版权声明。

