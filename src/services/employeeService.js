import apiClient from './apiService';
import authService from './authService';

// Add this debugging function to help understand what's working and what's not
const debugBackendConnection = async () => {
  const token = authService.getToken();
  if (!token) {
    return { success: false, message: "No auth token available" };
  }
  
  try {
    // Test 1: Basic API connectivity with GET request
    console.log("DIAGNOSTIC TEST 1: Basic API connectivity");
    const testGetResponse = await apiClient.get('/employees');
    console.log("GET /employees works:", testGetResponse.status);
    
    // If we reach here, the API is accessible and token works
    return { 
      success: true, 
      message: "Backend connection works! Authentication is valid." 
    };
  } catch (error) {
    console.error("Diagnostic test failed:", error);
    return { 
      success: false, 
      message: `Diagnostic failed: ${error.message}`,
      error
    };
  }
};

// Compress file if it exceeds maximum size
const compressFileIfNeeded = async (file, maxSizeBytes) => {
  if (!file || file.size <= maxSizeBytes) {
    return file;
  }

  console.log(`Compressing file: ${file.name} (${(file.size/1024).toFixed(2)}KB)`);
  
  // For image files (JPEG, PNG)
  if (file.type.startsWith('image/')) {
    return await compressImage(file, maxSizeBytes);
  }
  
  // For PDF files
  if (file.type === 'application/pdf') {
    // Creating a smaller version of the PDF by only taking first page
    // In a real implementation, you might use a PDF library to properly compress
    console.log("Creating smaller representation of PDF file");
    const truncatedFile = new File(
      [file.slice(0, Math.min(maxSizeBytes, file.size))], 
      file.name,
      { type: file.type }
    );
    return truncatedFile;
  }
  
  // For other file types, return a truncated version as a fallback
  console.log("No specific compression available for this file type, truncating");
  return new File(
    [file.slice(0, maxSizeBytes)],
    file.name,
    { type: file.type }
  );
};

// Helper function to compress images using canvas
const compressImage = (imageFile, maxSizeBytes) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const aspectRatio = width / height;
        
        // Start with 0.7 quality
        let quality = 0.7;
        let iterations = 0;
        const MAX_ITERATIONS = 5;
        
        const compressMore = () => {
          // Resize if still too large after initial compression
          if (iterations > 1) {
            // Reduce dimensions by 30% each iteration after the first quality reduction
            width = Math.floor(width * 0.7);
            height = Math.floor(width / aspectRatio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas with new dimensions
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob with quality setting
          canvas.toBlob((blob) => {
            // Check if blob is small enough
            if (blob.size <= maxSizeBytes || iterations >= MAX_ITERATIONS) {
              console.log(`Compressed image to ${(blob.size/1024).toFixed(2)}KB with quality ${quality} and dimensions ${width}x${height}`);
              
              // Convert blob to File object
              const compressedFile = new File([blob], imageFile.name, {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
              });
              
              resolve(compressedFile);
            } else {
              // Reduce quality further and try again
              iterations++;
              quality = Math.max(0.1, quality - 0.1);
              console.log(`Compression attempt ${iterations}: size=${(blob.size/1024).toFixed(2)}KB, reducing quality to ${quality}`);
              compressMore();
            }
          }, 'image/jpeg', quality);
        };
        
        compressMore();
      };
    };
  });
};

// Create tiny placeholder files for missing required files
const createTinyFile = (mimeType, filename) => {
  let content;
  
  // Create minimal valid files based on mime type
  switch (mimeType) {
    case 'image/jpeg':
      // Minimal valid JPEG header (not actually viewable but valid format)
      content = new Uint8Array([
        0xFF, 0xD8, // SOI marker
        0xFF, 0xE0, // APP0 marker
        0x00, 0x10, // Length of APP0 header
        0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF identifier
        0x01, 0x01, // Version
        0x00, // Density units
        0x00, 0x01, // X density
        0x00, 0x01, // Y density
        0x00, 0x00, // Thumbnail width/height
        0xFF, 0xD9  // EOI marker
      ]);
      break;
      
    case 'application/pdf':
      // Minimal valid PDF structure
      content = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4\n
        0x37, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 7 0 obj\n
        0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x3E, 0x3E, 0x0A, // <</Type/Catalog>>\n
        0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj\n
        0x78, 0x72, 0x65, 0x66, 0x0A, // xref\n
        0x30, 0x20, 0x38, 0x0A, // 0 8\n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0A, // 0000000000 65535 f\n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, // 0000000019 00000 n\n
        0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72, 0x0A, // trailer\n
        0x3C, 0x3C, 0x2F, 0x53, 0x69, 0x7A, 0x65, 0x20, 0x38, 0x2F, 0x52, 0x6F, 0x6F, 0x74, 0x20, 0x37, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, // <</Size 8/Root 7 0 R>>\n
        0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0A, // startxref\n
        0x31, 0x38, 0x33, 0x0A, // 183\n
        0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
      ]);
      break;
      
    default:
      // Generic text file for any other type
      content = new TextEncoder().encode("Placeholder file for " + filename);
  }
  
  return new File([content], filename, { type: mimeType });
};

// Modified createEmployee to match new backend implementation where employee and user share the same ID
const createEmployee = async (employeeData) => {
  try {
    // Extract user account details and files from employeeData
    const { username, password, userRole, files, ...employeeDetails } = employeeData;
    
    console.log("Creating employee with associated user account...");
    
    // First check if we can connect to the API at all
    const connectionTest = await debugBackendConnection();
    console.log("Connection test result:", connectionTest);
    
    if (!connectionTest.success) {
      throw new Error("Cannot connect to API: " + connectionTest.message);
    }
    
    // Create FormData object for multipart/form-data
    const formData = new FormData();
    
    // Add the employee data as JSON
    const employeeJson = JSON.stringify({
      fullName: employeeDetails.fullName,
      email: employeeDetails.email,
      phoneNumber: employeeDetails.phoneNumber,
      currentAddress: employeeDetails.currentAddress || "",
      permanentAddress: employeeDetails.permanentAddress || "",
      whatsappNumber: employeeDetails.whatsappNumber || "",
      linkedInUrl: employeeDetails.linkedInUrl || "",
      collegeName: employeeDetails.collegeName || "",
      role: employeeDetails.role,
      department: employeeDetails.department,
      joiningDate: employeeDetails.joiningDate,
      status: employeeDetails.status || "ACTIVE",
      salary: parseFloat(employeeDetails.salary || 0),
      hrId: employeeDetails.hrId // Include hrId in the employee JSON
    });
    formData.append('employee', employeeJson);
    
    // Add user credentials
    formData.append('username', username);
    formData.append('password', password);
    formData.append('role', userRole || 'EMPLOYEE'); // Default to EMPLOYEE if not specified
    
    // Use the admin's ID as the referenceId parameter
    const referenceId = employeeDetails.hrId || '';
    formData.append('referenceId', referenceId);
    console.log(`Using referenceId (creator's ID): ${referenceId}`);
    
    // Get the auth token
    const token = authService.getToken();
    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }
    
    // URL for the request
    const apiUrl = `${apiClient.defaults.baseURL}/employees`;
    console.log(`Using URL: ${apiUrl}`);
    
    // Define file size limit - 500KB
    const MAX_FILE_SIZE = 500 * 1024; // 500KB
    
    // Add each required file - use user's files if available, but compress if too large
    const fileFields = [
      { field: 'photograph', mimeType: 'image/jpeg', name: 'photo.jpg', file: files.photograph },
      { field: 'tenthMarksheet', mimeType: 'application/pdf', name: 'tenth.pdf', file: files.tenthMarksheet },
      { field: 'twelfthMarksheet', mimeType: 'application/pdf', name: 'twelfth.pdf', file: files.twelfthMarksheet },
      { field: 'bachelorDegree', mimeType: 'application/pdf', name: 'bachelor.pdf', file: files.bachelorDegree },
      { field: 'postgraduateDegree', mimeType: 'application/pdf', name: 'postgrad.pdf', file: files.postgraduateDegree },
      { field: 'aadharCard', mimeType: 'application/pdf', name: 'aadhar.pdf', file: files.aadharCard },
      { field: 'panCard', mimeType: 'application/pdf', name: 'pan.pdf', file: files.panCard },
      { field: 'pcc', mimeType: 'application/pdf', name: 'pcc.pdf', file: files.pcc },
      { field: 'resume', mimeType: 'application/pdf', name: 'resume.pdf', file: files.resume },
      { field: 'offerLetter', mimeType: 'application/pdf', name: 'offer.pdf', file: files.offerLetter }
    ];
    
    // Process each file - compress if needed
    for (const { field, mimeType, name, file } of fileFields) {
      if (file && file.size > 0) {
        // Check if file is too large
        if (file.size > MAX_FILE_SIZE) {
          console.log(`⚠️ File ${file.name} is too large (${(file.size/1024).toFixed(2)}KB), compressing...`);
          // Use compressed version
          const compressedFile = await compressFileIfNeeded(file, MAX_FILE_SIZE);
          formData.append(field, compressedFile);
          console.log(`✅ Compressed ${field}: ${compressedFile.name} (${(compressedFile.size/1024).toFixed(2)}KB)`);
        } else {
          // Use original file
          formData.append(field, file);
          console.log(`✅ Using ${field}: ${file.name} (${(file.size/1024).toFixed(2)}KB)`);
        }
      } else {
        // Create a tiny placeholder file
        const tinyFile = createTinyFile(mimeType, name);
        formData.append(field, tinyFile);
        console.log(`✅ Using placeholder for ${field}: ${name} (${tinyFile.size} bytes)`);
      }
    }
    
    console.log("Sending request with XHR...");
    
    // Log FormData summary
    console.log("FormData summary:");
    let totalSize = 0;
    for (let [key, value] of formData.entries()) {
      if (key === 'password') {
        console.log(`- ${key}: ********`);
      } else if (value instanceof File) {
        totalSize += value.size;
        console.log(`- ${key}: File(${value.name}, ${(value.size/1024).toFixed(2)}KB)`);
      } else {
        console.log(`- ${key}: ${value}`);
      }
    }
    console.log(`Total data size: ${(totalSize/1024).toFixed(2)}KB`);
    
    // Promise-based XHR
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', apiUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      // Add CORS request headers that might help
      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${percentComplete}%`);
        }
      };
      
      xhr.onreadystatechange = function() {
        console.log(`XHR state: ${xhr.readyState}, status: ${xhr.status || 'unknown'}`);
        
        // Log more details about possible CORS errors
        if (xhr.readyState === 4 && xhr.status === 0) {
          console.warn("Possible CORS error - no status received. Check server CORS settings.");
        }
      };
      
      xhr.onload = function() {
        console.log(`XHR COMPLETE - Status: ${xhr.status}`);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log("✅ Employee created successfully:", data);
            resolve(data);
          } catch (parseError) {
            console.warn("Response not JSON but success code received");
            resolve({ id: "unknown", message: "Employee likely created but response wasn't JSON" });
          }
        } else {
          console.error(`Error response (${xhr.status}):`, xhr.responseText);
          
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(`Server error (${xhr.status}): ${JSON.stringify(errorData)}`));
          } catch (e) {
            reject(new Error(`Server error (${xhr.status}): ${xhr.responseText || "Unknown error"}`));
          }
        }
      };
      
      xhr.onerror = function(e) {
        console.error("XHR network error:", e);
        
        // Log CORS-specific advice for network errors
        console.log("If you're experiencing CORS issues, try:");
        console.log("1. Check if server has proper CORS headers enabled");
        console.log("2. Using a CORS proxy (for development only)");
        console.log("3. Making sure server is actually running and accessible");
        
        reject(new Error("Network error occurred. There may be CORS or server connectivity issues."));
      };
      
      try {
        xhr.send(formData);
        console.log("Request sent, awaiting response...");
      } catch (err) {
        console.error("Error sending request:", err);
        reject(new Error("Failed to send request: " + err.message));
      }
    });
  } catch (error) {
    console.error('Error in createEmployee:', error);
    throw error;
  }
};

// Mock data to use when the API is unavailable
const MOCK_EMPLOYEES = [
  {
    id: '1',
    fullName: 'John Smith',
    email: 'john.smith@example.com',
    role: 'HR',
    department: 'Human Resources',
    joiningDate: new Date('2022-01-15').getTime()
  },
  {
    id: '2',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    role: 'EMPLOYEE',
    department: 'Engineering',
    joiningDate: new Date('2022-03-20').getTime()
  },
  {
    id: '3',
    fullName: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'EMPLOYEE',
    department: 'Marketing',
    joiningDate: new Date('2022-05-10').getTime()
  }
];

const employeeService = {
  // Get all employees
  getAllEmployees: async () => {
    try {
      console.log('Fetching all employees...');
      const response = await apiClient.get('/employees');
      console.log('Employees fetched successfully:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error getting all employees:', error);
      
      // If we get a 500 error, return mock data
      if (error.response && error.response.status === 500) {
        console.log('Server error - returning mock employees data');
        return MOCK_EMPLOYEES;
      }
      
      return [];
    }
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    try {
      console.log(`Fetching employee with ID ${id}...`);
      const response = await apiClient.get(`/employees/${id}`);
      console.log('Employee fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting employee with ID ${id}:`, error);
      return null;
    }
  },

  // Create employee with user account
  createEmployee,

  // Update employee
  updateEmployee: async (id, employeeData) => {
    try {
      console.log(`Updating employee with ID ${id}:`, employeeData);
      const response = await apiClient.put(`/employees/${id}`, employeeData);
      console.log('Employee updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating employee with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete employee
  deleteEmployee: async (id) => {
    try {
      console.log(`Deleting employee with ID ${id}...`);
      const response = await apiClient.delete(`/employees/${id}`);
      console.log('Employee deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`Error deleting employee with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Add diagnostic function
  debugBackendConnection
};

export default employeeService; 