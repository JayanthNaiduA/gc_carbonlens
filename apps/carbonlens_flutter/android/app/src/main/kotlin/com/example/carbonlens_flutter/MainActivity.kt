package com.example.carbonlens_flutter

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import java.io.ByteArrayOutputStream

class MainActivity : FlutterActivity() {
    private var pendingCapture: MethodChannel.Result? = null
    private val photoRequest = 4201

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "carbonlens/evidence")
            .setMethodCallHandler { call, result ->
                if (call.method != "pickImage") {
                    result.notImplemented()
                } else if (pendingCapture != null) {
                    result.error("CAPTURE_BUSY", "Finish the current photo selection first.", null)
                } else {
                    pendingCapture = result
                    val camera = call.argument<Boolean>("camera") == true
                    val intent = if (camera) Intent("android.media.action.IMAGE_CAPTURE") else
                        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                            type = "image/*"
                            addCategory(Intent.CATEGORY_OPENABLE)
                        }
                    try { startActivityForResult(intent, photoRequest) }
                    catch (_: Exception) {
                        pendingCapture = null
                        result.error("CAPTURE_UNAVAILABLE", "No photo provider is available.", null)
                    }
                }
            }
    }

    @Suppress("DEPRECATION")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != photoRequest) return
        val result = pendingCapture ?: return
        pendingCapture = null
        if (resultCode != Activity.RESULT_OK) { result.success(null); return }
        try {
            val output = ByteArrayOutputStream()
            val uri = data?.data
            val contentType: String
            if (uri != null) {
                contentType = contentResolver.getType(uri) ?: "application/octet-stream"
                contentResolver.openInputStream(uri)?.use { input ->
                    val buffer = ByteArray(8192)
                    while (true) {
                        val count = input.read(buffer)
                        if (count < 0) break
                        if (output.size() + count > 10 * 1024 * 1024) throw IllegalArgumentException()
                        output.write(buffer, 0, count)
                    }
                } ?: throw IllegalArgumentException()
            } else {
                // Camera intent provides a bounded preview. Select an existing
                // full-resolution image for detailed receipt OCR.
                val bitmap = data?.extras?.get("data") as? Bitmap ?: throw IllegalArgumentException()
                bitmap.compress(Bitmap.CompressFormat.JPEG, 90, output)
                contentType = "image/jpeg"
            }
            if (contentType !in listOf("image/jpeg", "image/png") || output.size() == 0) throw IllegalArgumentException()
            result.success(mapOf("bytes" to output.toByteArray(), "content_type" to contentType))
        } catch (_: Exception) {
            result.error("INVALID_IMAGE", "Choose a JPEG or PNG smaller than 10 MiB.", null)
        }
    }
}
