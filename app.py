
import os
import logging
import time
import threading
from flask import Flask, request, render_template, send_from_directory, jsonify
from blind_watermark import WaterMark
from werkzeug.utils import secure_filename


# 通用配置
FLASK_DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'

# 缓存清理配置
CACHE_CLEANUP_ENABLED = os.environ.get('CACHE_CLEANUP_ENABLED', 'true').lower() == 'true'
CACHE_MAX_AGE_SECONDS = int(os.environ.get('CACHE_MAX_AGE_SECONDS', 3600))  # 默认: 1小时
CACHE_CLEANUP_INTERVAL_SECONDS = int(os.environ.get('CACHE_CLEANUP_INTERVAL_SECONDS', 600))  # 默认: 10分钟

# --- 应用初始化 ---
app = Flask(__name__)

# --- 文件夹配置 ---
UPLOAD_FOLDER = 'web_tool/uploads'
PROCESSED_FOLDER = 'web_tool/processed'
LOG_FILE = 'web_tool/app.log'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# --- 日志配置 ---
if not FLASK_DEBUG:
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.ERROR,
        format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s'
    )

# --- 缓存清理逻辑 ---
def clear_old_files(folder_path, max_age_seconds):
    """删除文件夹中超过指定最长存留时间的文件。"""
    if not os.path.isdir(folder_path):
        return
    
    cutoff_time = time.time() - max_age_seconds
    
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) and os.path.getmtime(file_path) < cutoff_time:
                os.remove(file_path)
                app.logger.info(f"已删除旧缓存文件: {file_path}")
        except Exception as e:
            app.logger.error(f"删除文件 {file_path} 时出错: {e}")

def cleanup_task():
    """定期清理旧文件的后台任务。"""
    while True:
        app.logger.info("正在执行计划的缓存清理任务...")
        clear_old_files(app.config['UPLOAD_FOLDER'], CACHE_MAX_AGE_SECONDS)
        clear_old_files(app.config['PROCESSED_FOLDER'], CACHE_MAX_AGE_SECONDS)
        time.sleep(CACHE_CLEANUP_INTERVAL_SECONDS)

# --- 辅助函数 ---
def allowed_file(filename):
    """检查文件扩展名是否被允许。"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- 路由 ---
@app.route('/')
def index():
    """渲染主页面。"""
    return render_template('index.html')

@app.route('/embed', methods=['POST'])
def embed_watermark():
    """接收文件和水印文本，处理并返回结果。"""
    if 'file' not in request.files:
        return jsonify({'error': '请求中无文件部分'}), 400
    
    file = request.files['file']
    watermark_text = request.form.get('watermark_text')

    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400

    if not watermark_text:
        return jsonify({'error': '水印文本不能为空'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        original_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(original_path)

        processed_filename = 'watermarked_' + filename
        processed_path = os.path.join(app.config['PROCESSED_FOLDER'], processed_filename)

        try:
            bwm = WaterMark(password_img=1, password_wm=1)
            bwm.read_img(original_path)
            bwm.read_wm(watermark_text, mode='str')
            bwm.embed(processed_path)
            
            wm_length = len(bwm.wm_bit)
            
            return jsonify({
                'processed_image_url': f'/processed/{processed_filename}',
                'wm_length': wm_length
            })

        except Exception as e:
            app.logger.error(f"嵌入水印时发生错误: {str(e)}", exc_info=True)
            return jsonify({'error': '发生内部错误，请检查服务器日志。'}), 500
    
    return jsonify({'error': '不允许的文件类型'}), 400

@app.route('/extract', methods=['POST'])
def extract_watermark():
    """接收文件和水印长度，解析并返回结果。"""
    if 'file' not in request.files:
        return jsonify({'error': '请求中无文件部分'}), 400
    
    file = request.files['file']
    wm_length_str = request.form.get('wm_length')

    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400

    if not wm_length_str:
        return jsonify({'error': '需要提供水印长度'}), 400
    
    try:
        wm_length = int(wm_length_str)
    except ValueError:
        return jsonify({'error': '无效的水印长度'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            bwm = WaterMark(password_img=1, password_wm=1)
            extracted_text = bwm.extract(filepath, wm_shape=wm_length, mode='str')
            return jsonify({'extracted_text': extracted_text})
        except Exception as e:
            app.logger.error(f"解析水印时发生错误: {str(e)}", exc_info=True)
            return jsonify({'error': '发生内部错误，请检查服务器日志。'}), 500
            
    return jsonify({'error': '不允许的文件类型'}), 400

@app.route('/processed/<filename>')
def get_processed_image(filename):
    """提供处理后的图片。"""
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

# --- 主程序入口 ---
if __name__ == '__main__':
    # 启动缓存清理线程
    if CACHE_CLEANUP_ENABLED:
        cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
        cleanup_thread.start()
        print("缓存清理线程已启动。")

    from waitress import serve
    print("正在使用 Waitress 启动生产环境服务器...")
    serve(app, host='0.0.0.0', port=5000)
