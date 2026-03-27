import { Injectable } from '@nestjs/common';

@Injectable()
export class AiEngineService {
  /**
   * Mocked LLM analysis logic
   * In a real system, you would call OpenAI, Gemini, or a local Llama here.
   */
  async analyze(query: string) {
    const q = query.toLowerCase();
    
    // Simulating thinking time
    await new Promise(resolve => setTimeout(resolve, 800));

    if (q.includes('tài chính') || q.includes('sức khỏe')) {
      return {
        content: 'Báo cáo Phân tích Tài chính tức thời:',
        layout: 'finance',
        data: {
          cashFlow: '3.2 tỷ VND',
          growth: '8.1%',
          costStatus: 'Vượt 2.4% mảng R&D'
        }
      };
    }

    if (q.includes('tiến độ') || q.includes('skyline')) {
      return {
        content: '📊 Dự án SkyLine ERP: Đang đạt 72.5%. Phân tích các ticket tuần qua cho thấy rủi ro chậm trễ tại Module Kế toán đã được xử lý bằng cách tăng cường 2 Dev từ bộ phận Support. Dự kiến hoàn thành 15/05/2026.',
        layout: 'standard'
      };
    }

    if (q.includes('nhật bản') || q.includes('nguồn lực')) {
      return {
        content: '🇯🇵 Đề xuất cho Chi nhánh Nhật Bản: Dựa trên lịch Go-live tháng 4, AI đề xuất luân chuyển 3 Senior Dev có kinh nghiệm AWS từ VN sang Tokyo trong 2 tuần. Đồng thời, cấu hình Auto-scaling cho cụm Database để chịu tải cao điểm.',
        layout: 'standard'
      };
    }

    if (q.includes('biến động') || q.includes('nhân sự')) {
        return {
            content: '👥 Báo cáo nhân sự: Tỉ lệ turnover tháng này giảm 2% sau khi áp dụng chính sách làm việc Hybrid. Tuy nhiên, khối Kỹ thuật đang bị quá tải 15% (overclock). Cần xem xét tuyển dụng thêm Front-end hoặc thuê Vendor hỗ trợ.',
            layout: 'standard'
        };
    }

    if (q.includes('báo giá') || q.includes('quotation')) {
        return {
            content: '📑 Draft Báo giá Dự án Mới (Auto-Generated): Dựa trên scope đã thảo luận, AI ước tính ngân sách cho 6 Sprint (3 tháng): ~450,000,000 VND. Bao gồm: 3 Dev, 1 QA, 1 PM. Bạn có muốn xuất file PDF chính thức không?',
            layout: 'standard'
        };
    }

    if (q.includes('rủi ro') || q.includes('risk')) {
        return {
            content: '⚠️ Phân tích Rủi ro Hệ thống (Risk Analysis): Phát hiện 2 rủi ro quan trọng: \n1. Deadline dự án Mobile Banking bị trượt 4 ngày do thiếu tài liệu API từ Vendor. \n2. Biến động nhân sự cận Tết tại khối Frontend. Đề nghị: Kích hoạt kế hoạch dự phòng, mời Vendor B tham gia hỗ trợ gấp.',
            layout: 'standard'
        };
    }

    return {
      content: '🤖 Tôi đã ghi nhận yêu cầu: "' + query + '". Tôi đang quét toàn bộ dữ liệu 16 phân hệ (Tài chính, Dự án, Nhân sự, Sales...). Phân tích sơ bộ cho thấy mọi chỉ số đang ở mức an toàn. Bạn có muốn đi show sâu vào module nào không?',
      layout: 'standard'
    };
  }
}
